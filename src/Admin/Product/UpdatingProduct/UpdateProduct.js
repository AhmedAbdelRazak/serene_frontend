/** @format */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { getProducts } from "../../apiAdmin";
import CountUp from "react-countup";
import AttributesModal from "./AttributesModal";
import { isAuthenticated } from "../../../auth";
import UpdateProductSingle from "./UpdateProductSingle";
import { Button, Modal, Spin } from "antd";
import { gettingPrintifyProducts } from "../../apiAdmin";

const UpdateProduct = () => {
	const [allProducts, setAllProducts] = useState([]);
	const [modalVisible, setModalVisible] = useState(false);
	const [printifyModalVisible, setPrintifyModalVisible] = useState(false);
	const [clickedProduct, setClickedProduct] = useState({});
	const [selectedProductToUpdate, setSelectedProductToUpdate] =
		useState(undefined);
	const [q, setQ] = useState("");
	const [loading, setLoading] = useState(false);
	const [printifyResponse, setPrintifyResponse] = useState(null);

	const gettingAllProducts = () => {
		getProducts().then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setAllProducts(data);
			}
		});
	};

	useEffect(() => {
		gettingAllProducts();
		// eslint-disable-next-line
	}, []);

	const fetchPrintifyProducts = async () => {
		setLoading(true);
		setPrintifyResponse(null);
		setPrintifyModalVisible(true);

		try {
			const response = await gettingPrintifyProducts();
			setPrintifyResponse(response);
		} catch (error) {
			console.log(error);
			setPrintifyResponse({ error: "Failed to fetch Printify products" });
		} finally {
			setLoading(false);
		}
	};

	const renderPrintifyResponse = () => {
		if (!printifyResponse) return null;

		const { addedProducts, failedProducts, message } = printifyResponse;

		return (
			<div>
				<p>{message}</p>
				{addedProducts && addedProducts.length > 0 && (
					<div>
						<h3>Added Products</h3>
						<ul>
							{addedProducts.map((product, index) => (
								<li key={index}>{product}</li>
							))}
						</ul>
					</div>
				)}
				{failedProducts && failedProducts.length > 0 && (
					<div>
						<h3>Failed Products</h3>
						<ul>
							{failedProducts.map((product, index) => (
								<li
									key={index}
									style={{ color: "darkred", fontWeight: "bold" }}
								>
									{product.title}: {product.reason}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		);
	};

	function search(orders) {
		return orders.filter((row) => {
			return (
				row.productName.toLowerCase().indexOf(q) > -1 ||
				row.productName_Arabic.toLowerCase().indexOf(q) > -1 ||
				row.productSKU.toLowerCase().indexOf(q) > -1
			);
		});
	}

	const modifyingInventoryTable = () => {
		let modifiedArray = allProducts.map((i) => {
			return {
				productId: i._id,
				productName: i.productName,
				productName_Arabic: i.productName_Arabic,
				productPrice: i.priceAfterDiscount,
				productQty: i.addVariables
					? i.productAttributes
							.map((iii) => iii.quantity)
							.reduce((a, b) => a + b, 0)
					: i.quantity,
				productImage: i.thumbnailImage,
				productSKU: i.productSKU,
				addedBy: i.addedByEmployee,
				createdAt: i.createdAt,
				addVariables: i.addVariables,
				productAttributes: i.productAttributes,
				isPrintifyProduct: i.isPrintifyProduct,
			};
		});

		return modifiedArray;
	};

	const dataTable = () => {
		return (
			<div className='tableData'>
				<AttributesModal
					product={clickedProduct}
					modalVisible={modalVisible}
					setModalVisible={setModalVisible}
				/>
				<div className=' mb-3 form-group mx-3 text-center'>
					<label
						className='mt-3 mx-3'
						style={{
							fontWeight: "bold",
							fontSize: "1.05rem",
							color: "black",
							borderRadius: "20px",
						}}
					>
						Search
					</label>
					<input
						className='p-2 my-5 '
						type='text'
						value={q}
						onChange={(e) => setQ(e.target.value.toLowerCase())}
						placeholder='Search By Product Name Or SKU'
						style={{
							borderRadius: "20px",
							width: "50%",
							border: "1px lightgrey solid",
						}}
					/>
				</div>
				<table
					className='table table-bordered table-md-responsive table-hover'
					style={{ fontSize: "0.75rem", overflowX: "auto" }}
				>
					<thead className='thead-light'>
						<tr
							style={{
								fontSize: "0.8rem",
								textTransform: "capitalize",
								textAlign: "center",
							}}
						>
							<th scope='col'>Item #</th>
							<th scope='col'>Product Name</th>
							<th scope='col'>Product Main SKU</th>
							<th scope='col'>Product Price</th>
							<th scope='col'>Stock Onhand</th>
							<th scope='col'>Product Creation Date</th>
							<th scope='col'>Product Created By</th>
							<th scope='col'>Product Image</th>
							<th scope='col'>Update Product</th>
						</tr>
					</thead>
					<tbody
						className='my-auto'
						style={{
							fontSize: "0.75rem",
							textTransform: "capitalize",
							fontWeight: "bolder",
						}}
					>
						{search(modifyingInventoryTable()).map((s, i) => {
							return (
								<tr key={i} className=''>
									<td className='my-auto'>{i + 1}</td>

									<td>{s.productName}</td>
									<td>{s.productSKU}</td>
									<td>
										{s.addVariables ? (
											<span
												onClick={() => {
													setModalVisible(true);
													setClickedProduct(s);
												}}
												style={{
													fontWeight: "bold",
													textDecoration: "underline",
													color: "darkblue",
													cursor: "pointer",
												}}
											>
												Check Product Attributes
											</span>
										) : (
											s.productPrice
										)}
									</td>
									<td
										style={{
											background: s.productQty <= 0 ? "#fdd0d0" : "",
										}}
									>
										{s.productQty}
									</td>
									<td>{new Date(s.createdAt).toLocaleDateString()}</td>
									<td>{s.isPrintifyProduct ? "Printify" : s.addedBy.name}</td>
									<td style={{ width: "15%", textAlign: "center" }}>
										<img
											width='30%'
											height='30%'
											style={{ marginLeft: "20px" }}
											src={
												s.productImage[0].images[0]
													? s.productImage[0].images[0].url
													: null
											}
											alt={s.productName}
										/>
									</td>
									<Link
										to={`/admin/products?updateproduct`}
										onClick={() => {
											setSelectedProductToUpdate(s);
										}}
									>
										<td
											onClick={() => {
												setSelectedProductToUpdate(s);
											}}
											style={{
												color: "blue",
												fontWeight: "bold",
												cursor: "pointer",
											}}
										>
											Update Product...
										</td>
									</Link>

									{/* <td>{Invoice(s)}</td> */}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		);
	};

	function calculateStockLevel(products) {
		// Products without variables
		const noVarQty = products
			.filter((p) => !p.addVariables)
			.reduce((acc, p) => acc + Number(p.quantity), 0);

		// Products with variables
		const varQty = products
			.filter((p) => p.addVariables)
			.reduce((acc, p) => {
				const totalAttributesQty = p.productAttributes.reduce(
					(sum, attr) => sum + Number(attr.quantity),
					0
				);
				return acc + totalAttributesQty;
			}, 0);

		return noVarQty + varQty;
	}

	function calculateStockWorth(products) {
		const noVarWorth = products
			.filter((p) => !p.addVariables)
			.reduce(
				(acc, p) => acc + Number(p.quantity) * Number(p.priceAfterDiscount),
				0
			);

		const varWorth = products
			.filter((p) => p.addVariables)
			.reduce((acc, p) => {
				const totalAttributesWorth = p.productAttributes.reduce(
					(sum, attr) =>
						sum + Number(attr.quantity) * Number(attr.priceAfterDiscount),
					0
				);
				return acc + totalAttributesWorth;
			}, 0);

		return noVarWorth + varWorth;
	}

	function calculateStockCost(products) {
		const noVarCost = products
			.filter((p) => !p.addVariables)
			.reduce((acc, p) => acc + Number(p.quantity) * Number(p.price), 0);

		const varCost = products
			.filter((p) => p.addVariables)
			.reduce((acc, p) => {
				const totalAttributesCost = p.productAttributes.reduce(
					(sum, attr) => sum + Number(attr.quantity) * Number(attr.price),
					0
				);
				return acc + totalAttributesCost;
			}, 0);

		return noVarCost + varCost;
	}

	function calculatePurchasePrice(products) {
		const noVarCost = products
			.filter((p) => !p.addVariables)
			.reduce(
				(acc, p) => acc + Number(p.quantity) * Number(p.MSRPPriceBasic),
				0
			);

		const varCost = products
			.filter((p) => p.addVariables)
			.reduce((acc, p) => {
				const totalAttributesCost = p.productAttributes.reduce(
					(sum, attr) => sum + Number(attr.quantity) * Number(attr.MSRP),
					0
				);
				return acc + totalAttributesCost;
			}, 0);

		return noVarCost + varCost;
	}

	console.log(selectedProductToUpdate, "selectedProductToUpdate");
	return (
		<UpdateProductWrapper>
			<div className='mainContent'>
				<div className='tableWrapper container-fluid'>
					<div className='flex-container'>
						{" "}
						{/* Use flex layout */}
						<div className='card' style={{ background: "#f1416c" }}>
							<div className='card-body'>
								<h5 style={{ fontWeight: "bolder", color: "white" }}>
									Overall Products Count
								</h5>
								<CountUp
									style={{ color: "white" }}
									duration='3'
									delay={1}
									end={allProducts.length}
									separator=','
								/>
								<span
									style={{
										color: "white",
										marginLeft: "5px",
										fontSize: "1.2rem",
									}}
								>
									Products
								</span>
							</div>
						</div>
						<div className='card' style={{ background: "#009ef7" }}>
							<div className='card-body'>
								<h5 style={{ fontWeight: "bolder", color: "white" }}>
									Overall Inventory Level
								</h5>
								<CountUp
									style={{ color: "white" }}
									duration='3'
									delay={1}
									end={calculateStockLevel(allProducts)}
									separator=','
								/>
								<span
									style={{
										color: "white",
										marginLeft: "5px",
										fontSize: "1.2rem",
									}}
								>
									Items
								</span>
							</div>
						</div>
						{isAuthenticated().user.userRole === "Order Taker" ||
						isAuthenticated().user.userRole === "Operations" ||
						isAuthenticated().user.userRole === "Stock Keeper" ? null : (
							<div className='card' style={{ background: "#541838" }}>
								<div className='card-body'>
									<h5 style={{ fontWeight: "bolder", color: "white" }}>
										Purchase Price
									</h5>
									<CountUp
										style={{ color: "white" }}
										duration='3'
										delay={1}
										end={calculatePurchasePrice(allProducts)}
										separator=','
									/>
									<span
										style={{
											color: "white",
											marginLeft: "5px",
											fontSize: "1.2rem",
										}}
									>
										USD
									</span>
								</div>
							</div>
						)}
						{isAuthenticated().user.userRole === "Order Taker" ||
						isAuthenticated().user.userRole === "Operations" ||
						isAuthenticated().user.userRole === "Stock Keeper" ? null : (
							<div className='card' style={{ background: "#50cd89" }}>
								<div className='card-body'>
									<h5 style={{ fontWeight: "bolder", color: "white" }}>
										Total Selling Price
									</h5>
									<CountUp
										style={{ color: "white" }}
										duration='3'
										delay={1}
										end={calculateStockWorth(allProducts)}
										separator=','
									/>
									<span
										style={{
											color: "white",
											marginLeft: "5px",
											fontSize: "1.2rem",
										}}
									>
										USD
									</span>
								</div>
							</div>
						)}
						{isAuthenticated().user.userRole === "Order Taker" ||
						isAuthenticated().user.userRole === "Operations" ||
						isAuthenticated().user.userRole === "Stock Keeper" ? null : (
							<div className='card' style={{ background: "#185434" }}>
								<div className='card-body'>
									<h5 style={{ fontWeight: "bolder", color: "white" }}>
										Stock Worth
									</h5>
									<CountUp
										style={{ color: "white" }}
										duration='3'
										delay={1}
										end={calculateStockCost(allProducts)}
										separator=','
									/>
									<span
										style={{
											color: "white",
											marginLeft: "5px",
											fontSize: "1.2rem",
										}}
									>
										USD
									</span>
								</div>
							</div>
						)}
					</div>
					{selectedProductToUpdate && selectedProductToUpdate.productId ? (
						<div className='my-4'>
							<h4
								onClick={() => {
									setSelectedProductToUpdate(undefined);
									window.scrollTo({ top: 0, behavior: "smooth" });
								}}
							>
								Back To Products List
							</h4>
							<div className='my-3'>
								<UpdateProductSingle
									productId={selectedProductToUpdate.productId}
								/>
							</div>
						</div>
					) : (
						<div>
							<div className='mt-5 text-center'>
								<Button
									style={{ fontWeight: "bold", fontSize: "1rem" }}
									type='primary'
									onClick={fetchPrintifyProducts}
								>
									Update Website With Printify Products
								</Button>
							</div>

							{dataTable()}
						</div>
					)}

					<Modal
						title='Printify Product Sync'
						open={printifyModalVisible}
						onCancel={() => setPrintifyModalVisible(false)}
						footer={null}
					>
						{loading ? <Spin /> : renderPrintifyResponse()}
					</Modal>
				</div>
			</div>
		</UpdateProductWrapper>
	);
};

export default UpdateProduct;

const UpdateProductWrapper = styled.div`
	min-height: 980px;
	/* overflow-x: hidden; */
	/* background: #ededed; */

	.tableData {
		background: white;
		padding: 10px;
	}
	.grid-container {
		display: grid;
		grid-template-columns: ${(props) =>
			props.show ? "4.5% 95.5%" : "15.2% 84.8%"};
		margin: auto;
		/* border: 1px solid red; */
		/* grid-auto-rows: minmax(60px, auto); */
	}

	.tableWrapper {
		overflow-x: auto;
		margin-top: 80px;
	}

	.card-body span {
		font-size: 1.5rem;
		font-weight: bold;
	}

	/* tr:nth-child(even) {
		background: #fafafa !important;
	}
	tr:nth-child(odd) {
		background: #d3d3d3 !important;
	} */

	tr:hover {
		background: #009ef7 !important;
		color: white !important;
	}

	.flex-container {
		display: flex;
		flex-wrap: wrap; /* Wraps to the next line if cards exceed container width */
		justify-content: space-between; /* Adds spacing between cards */
		gap: 10px; /* Adjust gap between cards as needed */
	}

	.card {
		flex: 1; /* Cards evenly distribute space */
		min-width: 150px; /* Prevent cards from shrinking too much */
		text-align: center !important;
	}

	.card-body span {
		font-size: 1.5rem;
		font-weight: bold;
	}

	h4 {
		font-weight: bold;
		text-decoration: underline;
		font-size: 1.3rem;
		text-align: center;
		cursor: pointer;
	}

	@media (max-width: 1550px) {
		li {
			font-size: 0.85rem !important;
		}

		label {
			font-size: 0.8rem !important;
		}

		h3 {
			font-size: 1.2rem !important;
		}
	}

	@media (max-width: 1750px) {
		background: white;

		.grid-container {
			display: grid;
			/* grid-template-columns: 18% 82%; */
			grid-template-columns: ${(props) => (props.show ? "7% 93%" : "18% 82%")};
			margin: auto;
			/* border: 1px solid red; */
			/* grid-auto-rows: minmax(60px, auto); */
		}
	}

	@media (max-width: 1400px) {
		background: white;

		.grid-container {
			display: grid;
			grid-template-columns: 10% 95%;
			margin: auto;
			/* border: 1px solid red; */
			/* grid-auto-rows: minmax(60px, auto); */
		}
	}

	@media (max-width: 1200px) {
		.card-grid {
			grid-template-columns: repeat(2, 1fr); /* Adjust for smaller screens */
		}
	}

	@media (max-width: 750px) {
		.grid-container {
			display: grid;
			/* grid-template-columns: 16% 84%; */
			grid-template-columns: ${(props) => (props.show ? "0% 99%" : "0% 100%")};
			margin: auto;
			/* border: 1px solid red; */
			/* grid-auto-rows: minmax(60px, auto); */
		}
		h3 {
			margin-top: 60px !important;
		}

		.rightContentWrapper {
			margin-top: 20px;
			margin-left: ${(props) => (props.show ? "0px" : "20px")};
		}
	}
`;
