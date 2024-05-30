/** @format */

import React, { useState, Fragment, useEffect } from "react";
import { isAuthenticated } from "../../auth/index";
// import { Link } from "react-router-dom";
import {
	LoyaltyPointsAndStoreStatus,
	allLoyaltyPointsAndStoreStatus,
	cloudinaryUpload1,
} from "../apiAdmin";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import axios from "axios";
import ImageCard from "./ImageCard";
import StoreTimePicker from "./StoreTimePicker";
import { Spin } from "antd";

const StoreManagement = ({ chosenLanguage }) => {
	const [loyaltyPointsAward, setLoyaltyPointsAward] = useState("");
	const [discountPercentage, setDiscountPercentage] = useState("");
	const [onlineServicesFees, setOnlineServicesFees] = useState("");
	const [transactionFeePercentage, setTransactionFeePercentage] = useState("");
	const [purchaseTaxes, setPurchaseTaxes] = useState("");
	const [freeShippingLimit, setFreeShippingLimit] = useState("");
	const [discountOnFirstPurchase, setDiscountOnFirstPurchase] = useState("");
	const [addDiscountFirstPurch, setAddDiscountFirstPurch] = useState(false);
	const [activatePayOnDelivery, setActivatePayOnDelivery] = useState(false);
	const [activatePickupInStore, setActivatePickupInStore] = useState(false);
	const [loading2, setLoading2] = useState(false);
	const [activatePayOnline, setActivatePayOnline] = useState(false);
	const [daysStoreClosed, setDaysStoreClosed] = useState([]);
	const [addStoreLogo, setAddStoreLogo] = useState([]);
	const [addStoreName, setAddStoreName] = useState([]);
	const [sameDayShippingStart, setSameDayShippingStart] = useState("00:00");
	const [sameDayShippingEnd, setSameDayShippingEnd] = useState("23:59");
	const [allHours, setAllHours] = useState("23:59");

	const [
		// eslint-disable-next-line
		alreadySetLoyaltyPointsManagement,
		setAlreadySetLoyaltyPointsManagement,
	] = useState("");
	const [query, setQuery] = useState([]);
	// eslint-disable-next-line
	const [error, setError] = useState(false);
	// eslint-disable-next-line
	const [success, setSuccess] = useState(false);

	// destructure user and token from localstorage
	const { user, token } = isAuthenticated();

	const handleChange1 = (e) => {
		setError("");
		setLoyaltyPointsAward(e.target.value);
	};
	const handleChange2 = (e) => {
		setError("");
		setDiscountPercentage(e.target.value);
	};
	const handleChange3 = (e) => {
		setError("");
		setOnlineServicesFees(e.target.value);
	};
	const handleChange4 = (e) => {
		setError("");
		setTransactionFeePercentage(e.target.value);
	};
	const handleChange5 = (e) => {
		setError("");
		setPurchaseTaxes(e.target.value);
	};
	const handleChange6 = (e) => {
		setError("");
		setFreeShippingLimit(e.target.value);
	};
	const handleChange7 = (e) => {
		setError("");
		setDiscountOnFirstPurchase(e.target.value);
	};

	const handleChange8 = (e) => {
		setError("");
		setAddDiscountFirstPurch(e.target.value);
	};
	const handleChange9 = (e) => {
		setError("");
		setAddStoreName(e.target.value);
	};

	const handleChange10 = (e) => {
		setError("");
		setActivatePayOnDelivery(e.target.value);
	};

	const handleChange11 = (e) => {
		setError("");
		setActivatePickupInStore(e.target.value);
	};

	const handleChange12 = (e) => {
		setError("");
		setActivatePayOnline(e.target.value);
	};

	const fileUploadAndResizeLogo = async (e) => {
		setLoading2(true);
		let files = e.target.files;
		let allUploadedFiles = addStoreLogo;

		if (files) {
			for (let i = 0; i < files.length; i++) {
				if (files[i].size > 1.1 * 1024 * 1024) {
					setLoading2(false);
					toast.error("The image should be 1 megabytes or less");
					continue; // Skip this file and move to the next
				}

				let reader = new FileReader();
				reader.readAsDataURL(files[i]);

				reader.onload = (event) => {
					let img = new Image();
					img.src = event.target.result;

					img.onload = () => {
						// Set the desired dimensions for the resized image
						const maxSize = 720;

						let width = img.width;
						let height = img.height;

						// Calculate the aspect ratio to maintain the image's proportions
						if (width > height) {
							if (width > maxSize) {
								height *= maxSize / width;
								width = maxSize;
							}
						} else {
							if (height > maxSize) {
								width *= maxSize / height;
								height = maxSize;
							}
						}

						// Set canvas dimensions to the calculated size
						let canvas = document.createElement("canvas");
						canvas.width = width;
						canvas.height = height;

						// Draw the resized image onto the canvas
						let ctx = canvas.getContext("2d");
						ctx.drawImage(img, 0, 0, width, height);

						// Convert the canvas to a base64 PNG string
						let uri = canvas.toDataURL("image/png");

						// Upload the image to Cloudinary
						cloudinaryUpload1(user._id, token, { image: uri })
							.then((data) => {
								allUploadedFiles.push(data);
								setAddStoreLogo({ ...addStoreLogo, images: allUploadedFiles });
								setLoading2(false);
							})
							.catch((err) => {
								console.log("CLOUDINARY UPLOAD ERR", err);
								setLoading2(false);
							});
					};
				};
			}
		}
	};

	const FileUploadStoreLogo = () => {
		return (
			<>
				{loading2 ? (
					<div style={{ textAlign: "center", marginTop: "10%" }}>
						<Spin size='large' />
					</div>
				) : (
					<ImageCard
						addThumbnail={addStoreLogo}
						handleImageRemove={handleImageRemove}
						setAddThumbnail={setAddStoreLogo}
						fileUploadAndResizeThumbNail={fileUploadAndResizeLogo}
					/>
				)}
			</>
		);
	};

	const handleImageRemove = (public_id) => {
		// console.log("remove image", public_id);
		axios
			.post(
				`${process.env.REACT_APP_API_URL}/admin/removeimage/${user._id}`,
				{ public_id },
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			)
			.then((res) => {
				// eslint-disable-next-line
				const { images } = addThumbnail;
				// let filteredImages = images.filter((item) => {
				// 	return item.public_id !== public_id;
				// });
				setAddStoreLogo([]);
			})
			.catch((err) => {
				console.log(err);
				// setTimeout(function () {
				// 	window.location.reload(false);
				// }, 1000);
			});
	};

	const handleQueryChange = (event) => {
		if (event.target.checked && !query.includes(event.target.value)) {
			setQuery([...query, event.target.value]);
			setDaysStoreClosed({ ...daysStoreClosed, daysStoreClosed: query });
		} else if (!event.target.checked && query.includes(event.target.value)) {
			setQuery(query.filter((q) => q !== event.target.value));
			setDaysStoreClosed({ ...daysStoreClosed, daysStoreClosed: query });
		}

		setDaysStoreClosed({ ...daysStoreClosed, daysStoreClosed: query });
	};

	useEffect(() => {
		setDaysStoreClosed({ ...daysStoreClosed, daysStoreClosed: query });
		// eslint-disable-next-line
	}, [query]);

	const gettingPreviousLoyaltyPointsManagement = () => {
		allLoyaltyPointsAndStoreStatus(token).then((data) => {
			if (data.error) {
				setError(data.error);
			} else {
				setError("");
				var lastStoreSettings = data && data[data.length - 1];
				var lastDaysStoreClosed =
					lastStoreSettings && lastStoreSettings.daysStoreClosed
						? lastStoreSettings.daysStoreClosed
						: [];

				if (lastStoreSettings) {
					setAlreadySetLoyaltyPointsManagement(lastStoreSettings);
					setLoyaltyPointsAward(lastStoreSettings.loyaltyPointsAward);
					setAddStoreName(lastStoreSettings.addStoreName);
					setDiscountPercentage(lastStoreSettings.discountPercentage);
					setOnlineServicesFees(lastStoreSettings.onlineServicesFees);
					setTransactionFeePercentage(
						lastStoreSettings.transactionFeePercentage
					);
					setPurchaseTaxes(lastStoreSettings.purchaseTaxes);
					setFreeShippingLimit(lastStoreSettings.freeShippingLimit);
					setDiscountOnFirstPurchase(lastStoreSettings.discountOnFirstPurchase);
					setAddDiscountFirstPurch(lastStoreSettings.addDiscountFirstPurch);
					setActivatePayOnDelivery(
						lastStoreSettings && lastStoreSettings.activatePayOnDelivery
					);
					setActivatePickupInStore(
						lastStoreSettings && lastStoreSettings.activatePickupInStore
					);
					setActivatePayOnline(
						lastStoreSettings && lastStoreSettings.activatePayOnline
					);
					setSameDayShippingStart(
						lastStoreSettings && lastStoreSettings.sameDayShippingStart
					);
					setSameDayShippingEnd(
						lastStoreSettings && lastStoreSettings.sameDayShippingEnd
					);

					setQuery(lastDaysStoreClosed);

					setDaysStoreClosed({ ...daysStoreClosed, lastDaysStoreClosed });

					setAddStoreLogo({
						images:
							lastStoreSettings && lastStoreSettings.addStoreLogo
								? lastStoreSettings.addStoreLogo
								: [],
					});
				}
			}
		});
	};

	useEffect(() => {
		gettingPreviousLoyaltyPointsManagement();
		// eslint-disable-next-line
	}, []);

	const clickSubmit = (e) => {
		e.preventDefault();
		setError("");
		setSuccess(false);

		LoyaltyPointsAndStoreStatus(user._id, token, {
			loyaltyPointsAward,
			discountPercentage,
			daysStoreClosed: daysStoreClosed.daysStoreClosed,
			onlineServicesFees: onlineServicesFees,
			transactionFeePercentage: transactionFeePercentage,
			purchaseTaxes: purchaseTaxes,
			freeShippingLimit: freeShippingLimit,
			discountOnFirstPurchase: discountOnFirstPurchase,
			addStoreLogo: addStoreLogo.images,
			addStoreName: addStoreName,
			activatePayOnDelivery: activatePayOnDelivery,
			activatePickupInStore: activatePickupInStore,
			activatePayOnline: activatePayOnline,
			sameDayShippingEnd: sameDayShippingEnd,
			sameDayShippingStart: sameDayShippingStart,
		}).then((data) => {
			if (data.error) {
				setError(data.error);
			} else {
				toast.success(
					"Loyalty Points and Store Status were successfully Added."
				);
				setError("");
				setTimeout(function () {
					setLoyaltyPointsAward("");
					setDiscountPercentage("");
					setDaysStoreClosed([]);
				}, 2000);
				setTimeout(function () {
					window.location.reload(false);
				}, 2500);
			}
		});
	};

	console.log(sameDayShippingEnd, "sameDayShippingEnd");
	console.log(sameDayShippingStart, "sameDayShippingStart");
	console.log(activatePayOnDelivery, "activatePayOnDelivery");
	console.log(activatePickupInStore, "activatePickupInStore");

	const LoyaltyPointsAndStoreStatusForm = () => (
		<form
			onSubmit={clickSubmit}
			className='my-3'
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
		>
			<div className='row'>
				<div className='col-md-3'>{FileUploadStoreLogo()}</div>

				<div className='col-md-9'>
					<div className='row'>
						<div className='col-md-4'>
							<div
								className='form-group'
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "left",
								}}
							>
								<label className='text-muted'>
									{" "}
									{chosenLanguage === "Arabic"
										? "اسم العلامة التجارية"
										: "Brand Name"}{" "}
								</label>
								<input
									type='text'
									className='form-control'
									onChange={handleChange9}
									value={addStoreName}
									placeholder={
										chosenLanguage === "Arabic"
											? "اسم المتجر أو اسم العلامة التجارية"
											: "Store Name or Brand Name"
									}
									required
								/>
							</div>
						</div>

						<div className='col-md-4'>
							<div
								className='form-group'
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "left",
								}}
							>
								<label className='text-muted'>
									{chosenLanguage === "Arabic"
										? "نقاط الولاء لمكافأة العميل"
										: "Loyalty Points To Award"}{" "}
								</label>
								<input
									type='number'
									className='form-control'
									onChange={handleChange1}
									value={loyaltyPointsAward}
									placeholder={
										chosenLanguage === "Arabic"
											? "عدد النقاط حتى تتمكن من منح العميل نسبة مئوية محددة"
											: "Number of points so you can award the customer with a specific %"
									}
									required
								/>
							</div>
						</div>

						<div className='col-md-4'>
							<div
								className='form-group'
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "left",
								}}
							>
								<label className='text-muted'>
									{chosenLanguage === "Arabic"
										? "نسبة الخصم لنقاط الولاء"
										: "Loyalty Points' Discount Percentage"}
								</label>
								<input
									type='number'
									className='form-control'
									onChange={handleChange2}
									value={discountPercentage}
									placeholder={
										chosenLanguage === "Arabic"
											? "النسبة التي سيتم خصمها من إجمالي المستخدم في حالة وصولها إلى النقاط المطلوبة مثلا."
											: "Percentage to be discounted from the user total if reached to the required points e.g. 10% will be added as 10"
									}
									required
								/>
							</div>
						</div>

						<div className='col-md-4'>
							<div
								className='form-group'
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "left",
								}}
							>
								<label className='text-muted'>
									{chosenLanguage === "Arabic"
										? "رسوم التحويل ٪"
										: "Transaction Fee %"}{" "}
								</label>
								<input
									type='number'
									className='form-control'
									onChange={handleChange4}
									value={transactionFeePercentage}
									placeholder='Transaction Fee % is the % charged on every transaction. e.g. 2.5% will be added as 2.5'
									required
								/>
							</div>
						</div>

						<div className='col-md-4'>
							<div
								className='form-group'
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "left",
								}}
							>
								<label className='text-muted'>
									{chosenLanguage === "Arabic"
										? "ضرائب الشراء %"
										: "Purchase Taxes %"}{" "}
								</label>
								<input
									type='number'
									className='form-control'
									onChange={handleChange5}
									value={purchaseTaxes}
									placeholder='Purchase Taxes is a percentage value'
									required
								/>
							</div>
						</div>

						<div className='col-md-4'>
							<div
								className='form-group'
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "left",
								}}
							>
								<label className='text-muted'>
									{chosenLanguage === "Arabic"
										? "رسوم الخدمات عبر الإنترنت (رسوم ثابتة)"
										: "	Online Services Fees (Flat Fee)"}
								</label>
								<input
									type='number'
									className='form-control'
									onChange={handleChange3}
									value={onlineServicesFees}
									required
									placeholder='Online Services fee is the fee charged on scheduling online (e.g. 25 cents will be added as "0.25"'
								/>
							</div>
						</div>

						<div className='col-md-6'>
							<div
								className='form-group'
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "left",
								}}
							>
								<label className='text-muted'>
									{chosenLanguage === "Arabic"
										? "الحد الإجمالي للقيمة بالدينار الكويتي للحصول على شحن مجاني"
										: "Total USD Value Limit To get Free Shipping"}
								</label>
								<input
									type='number'
									className='form-control'
									onChange={handleChange6}
									value={freeShippingLimit}
									placeholder='Min USD value purchase to get free shipping (e.g. 100 USD will be added as 100)'
								/>
							</div>
						</div>

						<div className='col-md-6'>
							<div
								className='form-group'
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "left",
								}}
							>
								<label className='text-muted'>
									{chosenLanguage === "Arabic"
										? "هل تريد إضافة خصم من أول عملية شراء للمستخدم؟"
										: "Do you want to add discount from user's first purchase?"}
								</label>
								<div className='form-group'>
									<select onChange={handleChange8} className='form-control'>
										<option>Please select / Required*</option>
										<option value='0'>No</option>
										<option value='1'>Yes</option>
									</select>
								</div>
								{addDiscountFirstPurch === "1" ? (
									<>
										<label
											className=''
											style={{
												fontSize: "0.8rem",
												fontWeight: "bold",
												color: "black ",
											}}
										>
											{chosenLanguage === "Arabic"
												? "ما هي النسبة التي تريد أن يحصل عليها العميل من أول عملية شراء له؟"
												: "What % would you like the customer to get off his/her first purchase?"}
										</label>
										<input
											type='number'
											className='form-control'
											onChange={handleChange7}
											value={discountOnFirstPurchase}
											placeholder='Discount off first purchase percentage (e.g. 10 precent off will be added as 10)'
										/>
									</>
								) : null}
							</div>
						</div>
					</div>

					<div
						className='w-100'
						style={{
							textAlign: chosenLanguage === "Arabic" ? "right" : "left",
						}}
					>
						<label
							style={{
								textAlign: chosenLanguage === "Arabic" ? "right" : "left",
							}}
						>
							{" "}
							{chosenLanguage === "Arabic"
								? "المتجر مغلق في أيام:"
								: "Store Closed on days:"}{" "}
						</label>
						<div className='checkboxes border-gray-200 border border-solid  mx-auto text-center'>
							<label htmlFor='one' className='block mx-1'>
								<input
									type='checkbox'
									id='one'
									onChange={handleQueryChange}
									value='Saturday'
									className='m-1'
									checked={query.indexOf("Saturday") > -1}
								/>
								Saturday
							</label>
							<label htmlFor='two' className='block mx-1'>
								<input
									type='checkbox'
									id='two'
									onChange={handleQueryChange}
									value='Sunday'
									className='m-1'
									checked={query.indexOf("Sunday") > -1}
								/>
								Sunday
							</label>
							<label htmlFor='three' className='block mx-1'>
								<input
									type='checkbox'
									id='three'
									onChange={handleQueryChange}
									value='Monday'
									className='m-1'
									checked={query.indexOf("Monday") > -1}
								/>
								Monday
							</label>
							<label htmlFor='four' className='block mx-1'>
								<input
									type='checkbox'
									id='four'
									onChange={handleQueryChange}
									value='Tuesday'
									className='m-1'
									checked={query.indexOf("Tuesday") > -1}
								/>
								Tuesday
							</label>
							<label htmlFor='five' className='block mx-1'>
								<input
									type='checkbox'
									id='five'
									onChange={handleQueryChange}
									value='Wednesday'
									className='m-1'
								/>
								Wednesday
							</label>
							<label htmlFor='six' className='block mx-1'>
								<input
									type='checkbox'
									id='six'
									onChange={handleQueryChange}
									value='Thursday'
									className='m-1'
									checked={query.indexOf("Thursday") > -1}
								/>
								Thursday
							</label>
							<label htmlFor='seven' className='block mx-1'>
								<input
									type='checkbox'
									id='seven'
									onChange={handleQueryChange}
									value='Friday'
									className='m-1'
									checked={query.indexOf("Friday") > -1}
								/>
								Friday
							</label>
						</div>
					</div>
					<div className='form-group mt-3'>
						<StoreTimePicker
							language={chosenLanguage}
							openTime={sameDayShippingStart}
							setOpenTime={setSameDayShippingStart}
							closeTime={sameDayShippingEnd}
							setCloseTime={setSameDayShippingEnd}
							allHours={allHours}
							setAllHours={setAllHours}
						/>
					</div>
					<div className='row my-2'>
						<div className='col-md-4 mx-auto'>
							<div
								className='form-group'
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "left",
								}}
							>
								<label>
									{" "}
									Pay On Delivery{" "}
									<span style={{ color: "green", fontWeight: "bolder" }}>
										{activatePayOnDelivery === true ? "(Activated)" : ""}
									</span>{" "}
								</label>

								<select onChange={handleChange10} className='form-control'>
									<option>Please select</option>
									<option value='0'>No</option>
									<option value='1'>Yes</option>
								</select>
							</div>
						</div>

						<div className='col-md-4 mx-auto'>
							<div
								className='form-group'
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "left",
								}}
							>
								<label> Pickup in Store</label>
								<span style={{ color: "green", fontWeight: "bolder" }}>
									{activatePickupInStore === true ? "(Activated)" : ""}
								</span>{" "}
								<select onChange={handleChange11} className='form-control'>
									<option>Please select</option>
									<option value='0'>No</option>
									<option value='1'>Yes</option>
								</select>
							</div>
						</div>

						<div className='col-md-4 mx-auto'>
							<div
								className='form-group'
								style={{
									textAlign: chosenLanguage === "Arabic" ? "right" : "left",
								}}
							>
								<label>
									{" "}
									Online Payment{" "}
									<span style={{ color: "green", fontWeight: "bolder" }}>
										{activatePayOnline === true ? "(Activated)" : ""}
									</span>{" "}
								</label>

								<select onChange={handleChange12} className='form-control'>
									<option>Please select</option>
									<option value='0'>No</option>
									<option value='1'>Yes</option>
								</select>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='text-center mx-auto w-50'>
				<button className='btn btn-outline-primary my-3'>
					{chosenLanguage === "Arabic"
						? "تعديل إعدادات المتجر"
						: "Add To Management Settings"}
				</button>
			</div>
		</form>
	);

	return (
		<Fragment>
			<div
				className=''
				dir={chosenLanguage === "Arabic" ? "ltr" : "ltr"}
				style={{
					marginBottom: "20px",
				}}
			>
				<ToastContainer />
				{LoyaltyPointsAndStoreStatusForm()}
			</div>
		</Fragment>
	);
};

export default StoreManagement;
