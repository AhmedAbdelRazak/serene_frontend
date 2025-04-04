/** @format */

import React, { useState, useEffect } from "react";
import { Select } from "antd";
import Resizer from "react-image-file-resizer";
import { cloudinaryUpload1, getColors, getSizes } from "../../apiSeller";
import { isAuthenticated } from "../../../auth";
import axios from "axios";
import MultipleImageCard from "./MultipleImageCard";

const { Option } = Select;

const isActive2 = (clickedLink, sureClickedLink) => {
	if (clickedLink === sureClickedLink) {
		return {
			background: "#dbeeff",
			fontWeight: "bold",
			padding: "3px",
			borderRadius: "5px",
			fontSize: "14px",
		};
	} else {
		return { color: "black", fontWeight: "bold", fontSize: "12px" };
	}
};

const UpdatingProductVariable = ({
	clickedVariableLink,
	setClickedVariableLink,
	setAddVariables,
	addVariables,
	setChosenColors,
	chosenColors,
	setChosenSizes,
	chosenSizes,
	setVariablesSubmit,
	variablesSubmit,
	productAttributesFinal,
	setProductAttributesFinal,
	setClickedLink,
	productAttributes,
	addThumbnail,
	setAddThumbnail,
}) => {
	const [allColors, setAllColors] = useState([]);
	const [allSizes, setAllSizes] = useState([]);
	const { user, token } = isAuthenticated();

	const ColorsImageUpload = (e, c) => {
		let files = e.target.files;
		if (files) {
			let pickedAttribute = productAttributesFinal.find((i) => i.color === c);
			let allUploadedFiles = [...pickedAttribute.productImages]; // Initialize with existing images

			for (let i = 0; i < files.length; i++) {
				Resizer.imageFileResizer(
					files[i],
					800,
					954,
					"JPEG",
					100,
					0,
					(uri) => {
						cloudinaryUpload1(user._id, token, { image: uri })
							.then((data) => {
								allUploadedFiles.push(data); // Push new images to the array
								updatePickedAttribute(c, allUploadedFiles);
							})
							.catch((err) => {
								console.log("CLOUDINARY UPLOAD ERR", err);
							});
					},
					"base64"
				);
			}
		}
	};

	const updatePickedAttribute = (color, uploadedFiles) => {
		let pickedAttribute = productAttributesFinal.find((i) => i.color === color);
		if (pickedAttribute) {
			pickedAttribute = {
				...pickedAttribute,
				productImages: uploadedFiles,
			};

			const index = productAttributesFinal.findIndex((object) => {
				return object.color === color;
			});

			if (index !== -1) {
				setClickedVariableLink("ImagesLoading");
				productAttributesFinal[index].productImages =
					pickedAttribute.productImages;
				setTimeout(() => {
					setClickedVariableLink("SizesColorsImages");
				}, 3000);
			}
		}
	};

	const adjustingQuantity = (e, p) => {
		const index = productAttributesFinal.findIndex((object) => {
			return object.PK === p.size + p.color;
		});

		if (index !== -1) {
			productAttributesFinal[index].quantity = e.target.value;
			setProductAttributesFinal([...productAttributesFinal]);
		}
	};

	const adjustingPrice = (e, p) => {
		const index = productAttributesFinal.findIndex((object) => {
			return object.PK === p.size + p.color;
		});

		if (index !== -1) {
			productAttributesFinal[index].price = e.target.value;
			setProductAttributesFinal([...productAttributesFinal]);
		}
	};

	const adjustingPriceAfterDiscount = (e, p) => {
		const index = productAttributesFinal.findIndex((object) => {
			return object.PK === p.size + p.color;
		});

		if (index !== -1) {
			productAttributesFinal[index].priceAfterDiscount = e.target.value;
			setProductAttributesFinal([...productAttributesFinal]);
		}
	};

	const adjustingMSRP = (e, p) => {
		const index = productAttributesFinal.findIndex((object) => {
			return object.PK === p.size + p.color;
		});

		if (index !== -1) {
			productAttributesFinal[index].MSRP = e.target.value;
			setProductAttributesFinal([...productAttributesFinal]);
		}
	};

	const adjustingWholeSalePrice = (e, p) => {
		const index = productAttributesFinal.findIndex((object) => {
			return object.PK === p.size + p.color;
		});

		if (index !== -1) {
			productAttributesFinal[index].WholeSalePrice = e.target.value;
			setProductAttributesFinal([...productAttributesFinal]);
		}
	};

	const adjustingDropShippingPrice = (e, p) => {
		const index = productAttributesFinal.findIndex((object) => {
			return object.PK === p.size + p.color;
		});

		if (index !== -1) {
			productAttributesFinal[index].DropShippingPrice = e.target.value;
			setProductAttributesFinal([...productAttributesFinal]);
		}
	};

	const adjustingVariablesSkus = (e, p) => {
		const index = productAttributesFinal.findIndex((object) => {
			return object.PK === p.size + p.color;
		});

		if (index !== -1) {
			productAttributesFinal[index].SubSKU = e.target.value;
			setProductAttributesFinal([...productAttributesFinal]);
		}
	};

	const handleImageRemove = (public_id) => {
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
				const { images } = addThumbnail;
				let filteredImages = images.filter((item) => {
					return item.public_id !== public_id;
				});
				setAddThumbnail({ ...addThumbnail, images: filteredImages });
			})
			.catch((err) => {
				console.log(err);
			});
	};

	const gettingAllColors = () => {
		getColors(token).then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setAllColors(data);
			}
		});
	};

	const gettingAllSizes = () => {
		getSizes(token).then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setAllSizes(data);
			}
		});
	};

	useEffect(() => {
		gettingAllColors();
		gettingAllSizes();
		// eslint-disable-next-line
	}, []);

	return (
		<div className='mb-5'>
			<div className='row mx-auto text-center variableLinkWrapper'>
				<div
					className='col-3 variableLinksItem'
					onClick={() => setClickedVariableLink("SizesColorsImages")}
					style={isActive2("SizesColorsImages", clickedVariableLink)}
				>
					Add Sizes, Colors And Images
				</div>
				{productAttributes.length > 0 && variablesSubmit ? (
					<>
						<div
							className='col-3 variableLinksItem '
							onClick={() => {
								setClickedVariableLink("StockLevel");
							}}
							style={isActive2("StockLevel", clickedVariableLink)}
						>
							Add Stock Level
						</div>
						<div
							className='col-3 variableLinksItem '
							onClick={() => setClickedVariableLink("ProductPrices")}
							style={isActive2("ProductPrices", clickedVariableLink)}
						>
							Add Product Prices
						</div>
						<div
							className='col-3 variableLinksItem '
							onClick={() => setClickedVariableLink("VariableSkus")}
							style={isActive2("VariableSkus", clickedVariableLink)}
						>
							Add Variables SKUs
						</div>
					</>
				) : null}
			</div>
			<hr />
			<form>
				{clickedVariableLink === "SizesColorsImages" ? (
					<div className='form-group col-md-8'>
						<label>Product Available Sizes</label>
						<Select
							mode='multiple'
							style={{ width: "100%" }}
							placeholder='Please Select Sizes'
							value={chosenSizes}
							onChange={(value) => {
								if (value.includes("nosizes") && value.length > 1) {
									value = ["nosizes"];
								} else if (value.length > 1 && value.includes("nosizes")) {
									value = value.filter((size) => size !== "nosizes");
								}
								setChosenSizes(value);
							}}
						>
							{allSizes &&
								allSizes.map((ss, iii) => (
									<Option
										style={{ textTransform: "uppercase" }}
										key={iii}
										value={ss.size}
									>
										{ss.size}
									</Option>
								))}
							<Option style={{ textTransform: "uppercase" }} value='nosizes'>
								Constant Size
							</Option>
						</Select>
						{chosenSizes.length > 0 ? (
							<div className='mt-4'>
								<label>Product Available Colors</label>
								<Select
									mode='multiple'
									style={{ width: "100%" }}
									placeholder='Please Select Colors'
									value={chosenColors}
									onChange={(value) => setChosenColors(value)}
								>
									{allColors &&
										allColors.map((c, ii) => (
											<Option
												style={{ textTransform: "capitalize" }}
												key={ii}
												value={c.hexa}
											>
												{c.color}
											</Option>
										))}
								</Select>
								{chosenColors.length > 0 && chosenSizes.length > 0 ? (
									<button
										className='btn btn-outline-primary my-3'
										onClick={(e) => {
											e.preventDefault();
											setVariablesSubmit(true);
										}}
									>
										Submit Updated Variables
									</button>
								) : null}
							</div>
						) : null}
					</div>
				) : null}

				{clickedVariableLink === "ImagesLoading" ? (
					<div
						className='mx-auto text-center ml-5'
						style={{
							fontSize: "1.2rem",
							fontWeight: "bold",
							color: "#0053a0",
						}}
					>
						Images Are Being Loaded....
					</div>
				) : null}

				{clickedVariableLink === "SizesColorsImages" ? (
					<div className='mt-5'>
						<div className='row'>
							{chosenColors &&
								variablesSubmit &&
								chosenColors.map((c, i) => (
									<div key={i} className='mx-auto col-md-6 text-center mt-4'>
										<MultipleImageCard
											productAttributesFinal={productAttributesFinal}
											handleImageRemove={handleImageRemove}
											allColors={allColors}
											ColorsImageUpload={ColorsImageUpload}
											setProductAttributesFinal={setProductAttributesFinal}
											c={c}
											i={i}
										/>
									</div>
								))}
						</div>
						{variablesSubmit ? (
							<div>
								<button
									className='btn btn-outline-primary my-5 ml-3'
									onClick={(e) => {
										e.preventDefault();
										setClickedVariableLink("StockLevel");
									}}
								>
									Next: Add Stock Level
								</button>
							</div>
						) : null}
					</div>
				) : null}

				{clickedVariableLink === "StockLevel" && variablesSubmit ? (
					<>
						{variablesSubmit ? (
							<div className='row mt-4'>
								{productAttributesFinal &&
									productAttributesFinal.map((p, i) => {
										return (
											<div className='form-group col-md-6 mx-auto' key={i}>
												<label
													className='text-muted'
													style={{ fontWeight: "bold", fontSize: "17px" }}
												>
													Product Stock Level (Color:{" "}
													<span style={{ color: "black" }}>
														{allColors[
															allColors.map((i) => i.hexa).indexOf(p.color)
														]
															? allColors[
																	allColors.map((i) => i.hexa).indexOf(p.color)
																].color
															: p.color}
													</span>{" "}
													Size: {p.size})
												</label>
												<input
													type='number'
													className='form-control'
													onChange={(e) => adjustingQuantity(e, p)}
													value={productAttributesFinal[i].quantity}
													required
												/>
											</div>
										);
									})}
							</div>
						) : null}
						{variablesSubmit ? (
							<button
								className='btn btn-outline-primary my-5 ml-3'
								onClick={(e) => {
									e.preventDefault();
									setClickedVariableLink("ProductPrices");
								}}
							>
								Next: Add Product Prices
							</button>
						) : null}
					</>
				) : null}

				{clickedVariableLink === "ProductPrices" && variablesSubmit ? (
					<>
						{variablesSubmit ? (
							<div className='row mt-4'>
								{productAttributes &&
									productAttributes.map((p, i) => {
										return (
											<React.Fragment key={i}>
												<div className='form-group col-md-4 mx-auto'>
													<label
														className='text-muted'
														style={{ fontWeight: "bold", fontSize: "13px" }}
													>
														Purchase Price (Color:{" "}
														<span style={{ color: "black" }}>
															{allColors[
																allColors.map((i) => i.hexa).indexOf(p.color)
															]
																? allColors[
																		allColors
																			.map((i) => i.hexa)
																			.indexOf(p.color)
																	].color
																: p.color}
														</span>{" "}
														Size: {p.size})
													</label>
													<input
														type='text'
														className='form-control'
														onChange={(e) => adjustingMSRP(e, p)}
														value={productAttributesFinal[i].MSRP}
														required
													/>
												</div>
												<div className='form-group col-md-4 mx-auto'>
													<label
														className='text-muted'
														style={{ fontWeight: "bold", fontSize: "13px" }}
													>
														Retailer Price (Color:{" "}
														<span style={{ color: "black" }}>
															{allColors[
																allColors.map((i) => i.hexa).indexOf(p.color)
															]
																? allColors[
																		allColors
																			.map((i) => i.hexa)
																			.indexOf(p.color)
																	].color
																: p.color}
														</span>{" "}
														Size: {p.size})
													</label>
													<input
														type='number'
														className='form-control'
														required
														onChange={(e) => adjustingPrice(e, p)}
														value={productAttributesFinal[i].price}
													/>
												</div>
												<div className='form-group col-md-4 mx-auto'>
													<label
														className='text-muted'
														style={{ fontWeight: "bold", fontSize: "13px" }}
													>
														Selling Price (Color:{" "}
														<span style={{ color: "black" }}>
															{allColors[
																allColors.map((i) => i.hexa).indexOf(p.color)
															]
																? allColors[
																		allColors
																			.map((i) => i.hexa)
																			.indexOf(p.color)
																	].color
																: p.color}
														</span>{" "}
														Size: {p.size})
													</label>
													<input
														type='text'
														className='form-control'
														onChange={(e) => adjustingPriceAfterDiscount(e, p)}
														value={productAttributesFinal[i].priceAfterDiscount}
														required
													/>
												</div>

												<div className='form-group col-md-5 mx-auto'>
													<label
														className='text-muted'
														style={{ fontWeight: "bold", fontSize: "13px" }}
													>
														Whole Sale Price (Color:{" "}
														<span style={{ color: "black" }}>
															{allColors &&
																allColors[0] &&
																allColors[
																	allColors.map((i) => i.hexa).indexOf(p.color)
																].color}
														</span>{" "}
														Size: {p.size})
													</label>
													<input
														type='text'
														className='form-control'
														onChange={(e) => adjustingWholeSalePrice(e, p)}
														value={productAttributesFinal[i].WholeSalePrice}
														required
													/>
												</div>

												<div className='form-group col-md-5 mx-auto'>
													<label
														className='text-muted'
														style={{ fontWeight: "bold", fontSize: "13px" }}
													>
														Dropshipping Price (Color:{" "}
														<span style={{ color: "black" }}>
															{allColors &&
																allColors[0] &&
																allColors[
																	allColors.map((i) => i.hexa).indexOf(p.color)
																].color}
														</span>{" "}
														Size: {p.size})
													</label>
													<input
														type='text'
														className='form-control'
														onChange={(e) => adjustingDropShippingPrice(e, p)}
														value={productAttributesFinal[i].DropShippingPrice}
														required
													/>
												</div>
											</React.Fragment>
										);
									})}
							</div>
						) : null}
						<button
							className='btn btn-outline-primary my-5 ml-3'
							onClick={(e) => {
								e.preventDefault();
								setClickedVariableLink("VariableSkus");
								window.scrollTo({ top: 0, behavior: "smooth" });
							}}
						>
							Next: Add Variables SKU's
						</button>
					</>
				) : null}

				{clickedVariableLink === "VariableSkus" && variablesSubmit ? (
					<>
						{variablesSubmit ? (
							<div className='row mt-4'>
								{productAttributes &&
									productAttributes.map((p, i) => {
										return (
											<React.Fragment key={i}>
												<div className='form-group col-md-6 mx-auto'>
													<label
														className='text-muted'
														style={{ fontWeight: "bold", fontSize: "17px" }}
													>
														Variable SKU (Color:{" "}
														<span style={{ color: "black" }}>
															{allColors[
																allColors.map((i) => i.hexa).indexOf(p.color)
															]
																? allColors[
																		allColors
																			.map((i) => i.hexa)
																			.indexOf(p.color)
																	].color
																: p.color}
														</span>{" "}
														Size: {p.size})
													</label>
													<input
														type='text'
														className='form-control'
														onChange={(e) => adjustingVariablesSkus(e, p)}
														value={productAttributesFinal[i].SubSKU}
														required
													/>
												</div>
											</React.Fragment>
										);
									})}
							</div>
						) : null}
						<button
							className='btn btn-outline-primary my-5 ml-3'
							onClick={(e) => {
								e.preventDefault();
								setClickedLink("ExtraOptions");
								window.scrollTo({ top: 0, behavior: "smooth" });
							}}
						>
							Next: Add Product Extra Options
						</button>
					</>
				) : null}
			</form>
		</div>
	);
};

export default UpdatingProductVariable;
