/** @format */
import React, { useState, useEffect } from "react";
import { updateShippingOptions, getShippingOptions } from "../apiAdmin";
import { isAuthenticated } from "../../auth/index";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

const UpdateShippingOptions = ({
	selectedOption,
	setSelectedOption,
	chosenLanguage,
}) => {
	const [carrierName, setCarrierName] = useState("");
	const [carrierName_Arabic, setCarrierName_Arabic] = useState("");
	const [loading, setLoading] = useState("");
	const [shippingPrice, setShippingPrice] = useState("");
	const [shippingPrice_Unit, setShippingPrice_Unit] = useState("");
	const [carrierStatus, setCarrierStatus] = useState("1");
	const [estimatedDays, setEstimatedDays] = useState("");
	// eslint-disable-next-line
	const [allShippingOptions, setAllShippingOptions] = useState([]);
	const [daysShippingClosed, setDaysShippingClosed] = useState([]);
	const [query, setQuery] = useState([]);
	const { user, token } = isAuthenticated();

	const gettingAllShippingOptions = () => {
		getShippingOptions(token).then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setAllShippingOptions(data);

				var daysShippingClosedHelper =
					selectedOption && selectedOption._id !== "undefined"
						? data.filter((s) => s._id === selectedOption._id)[0]
								.daysShippingClosed
						: [];

				setCarrierName(
					selectedOption &&
						selectedOption._id !== "undefined" &&
						data.filter((s) => s._id === selectedOption._id)[0].carrierName
				);
				setCarrierName_Arabic(
					selectedOption &&
						selectedOption._id !== "undefined" &&
						data.filter((s) => s._id === selectedOption._id)[0]
							.carrierName_Arabic
				);
				setShippingPrice(
					selectedOption &&
						selectedOption._id !== "undefined" &&
						data.filter((s) => s._id === selectedOption._id)[0].shippingPrice
				);
				setShippingPrice_Unit(
					selectedOption &&
						selectedOption._id !== "undefined" &&
						data.filter((s) => s._id === selectedOption._id)[0]
							.shippingPrice_Unit
				);
				setEstimatedDays(
					selectedOption &&
						selectedOption._id !== "undefined" &&
						data.filter((s) => s._id === selectedOption._id)[0].estimatedDays
				);

				setQuery(daysShippingClosedHelper);

				setDaysShippingClosed({
					...daysShippingClosed,
					daysShippingClosedHelper,
				});
			}
		});
	};

	useEffect(() => {
		gettingAllShippingOptions();
		// eslint-disable-next-line
	}, [selectedOption._id, loading]);

	const handleChange1 = (e) => {
		setCarrierName(e.target.value);
		setCarrierName_Arabic(e.target.value);
	};
	const handleChange2 = (e) => {
		setShippingPrice(e.target.value);
	};
	const handleChange3 = (e) => {
		setEstimatedDays(e.target.value);
	};

	const handleChange4 = (e) => {
		setCarrierStatus(e.target.value);
	};

	const handleChange6 = (e) => {
		setShippingPrice_Unit(e.target.value);
	};

	const clickSubmit = (e) => {
		e.preventDefault();
		setLoading(true);
		if (carrierStatus === "0") {
			if (
				window.confirm(
					"Are you sure you want to deactivate the selected Shipping Option?"
				)
			) {
				updateShippingOptions(selectedOption._id, user._id, token, {
					carrierName,
					carrierName_Arabic,
					shippingPrice,
					shippingPrice_Unit,
					estimatedDays,
					daysShippingClosed: daysShippingClosed.daysShippingClosed,
					carrierStatus,
				}).then((data) => {
					if (data.error) {
						console.log(data.error);
						setLoading(false);
						setTimeout(function () {
							window.location.reload(false);
						}, 2500);
					} else {
						toast.success("Shipping Option was successfully Updated.");
						setTimeout(function () {
							setLoading(false);
						}, 2000);
					}
				});
			}
		} else {
			updateShippingOptions(selectedOption._id, user._id, token, {
				carrierName,
				carrierName_Arabic,
				shippingPrice,
				shippingPrice_Unit,
				estimatedDays,
				daysShippingClosed: daysShippingClosed.daysShippingClosed,
				carrierStatus,
			}).then((data) => {
				if (data.error) {
					console.log(data.error);
					setLoading(false);
					setTimeout(function () {
						window.location.reload(false);
					}, 2500);
				} else {
					toast.success("Shipping Option was successfully Updated.");
					setTimeout(function () {
						setLoading(false);
					}, 2000);
				}
			});
		}
	};

	const handleQueryChange = (event) => {
		if (event.target.checked && !query.includes(event.target.value)) {
			setQuery([...query, event.target.value]);
			setDaysShippingClosed({
				...daysShippingClosed,
				daysShippingClosed: query,
			});
		} else if (!event.target.checked && query.includes(event.target.value)) {
			setQuery(query.filter((q) => q !== event.target.value));
			setDaysShippingClosed({
				...daysShippingClosed,
				daysShippingClosed: query,
			});
		}

		setDaysShippingClosed({ ...daysShippingClosed, daysShippingClosed: query });
	};

	useEffect(() => {
		setDaysShippingClosed({ ...daysShippingClosed, daysShippingClosed: query });
		// eslint-disable-next-line
	}, [query]);

	return (
		<>
			<ToastContainer />

			<div className=''>
				<div className='mx-auto text-center'>
					<h5
						onClick={() => {
							setSelectedOption("");
						}}
					>
						<Link to='#'>Back To Shipping List</Link>
					</h5>
				</div>

				<form onSubmit={clickSubmit}>
					<h3 className='text-center mb-4'> Add Shipping Options</h3>
					<div className='row'>
						<div className='form-group col-md-4 mx-auto'>
							<label className='text-muted'> Carrier/Package Name</label>
							<input
								type='text'
								className='form-control'
								onChange={handleChange1}
								value={carrierName}
								required
							/>
						</div>
						<div className='form-group col-md-4 mx-auto'>
							<label className='text-muted'>Shipping Price</label>
							<input
								type='number'
								className='form-control'
								onChange={handleChange2}
								value={shippingPrice}
								required
							/>
						</div>
						<div className='form-group col-md-4 mx-auto'>
							<label>Currency</label>
							<select
								name='shippingPrice_Unit'
								className='form-control'
								onChange={handleChange6}
							>
								{shippingPrice_Unit ? (
									<option value={shippingPrice_Unit}>
										{shippingPrice_Unit}
									</option>
								) : (
									<option value=''>Please select</option>
								)}
								<option>Kuwaiti Dinar</option>
								<option>US Dollar</option>
							</select>
						</div>
					</div>

					<div className='form-group col-md-10 mx-auto'>
						<label className='text-muted'>Estimated Delivery Time (days)</label>
						<input
							type='number'
							className='form-control'
							onChange={handleChange3}
							value={estimatedDays}
							placeholder='You should add in this field an estimation of how many days will take the carrier to deliver to the customer'
							required
						/>
					</div>

					<div className='w-100'>
						<label> Shipping Unavailable on days:</label>
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

						<div className='form-group mt-2'>
							<label className='text-muted'>Active Shipping Option</label>
							<select
								onChange={handleChange4}
								className='form-control'
								style={{ fontSize: "0.80rem" }}
							>
								<option>Please select / Required*</option>
								<option value='0'>Deactivate Shipping Option</option>
								<option value='1'>Activate Shipping Option</option>
							</select>
						</div>
					</div>
					<div className='text-center mx-auto w-75'>
						<button className='btn btn-outline-primary mb-3'>
							Update Shipping Option
						</button>
					</div>
				</form>
			</div>
		</>
	);
};

export default UpdateShippingOptions;
