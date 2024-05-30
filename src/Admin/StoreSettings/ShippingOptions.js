/** @format */

import React, { useState, useEffect } from "react";
import { isAuthenticated } from "../../auth/index";
// import { Link } from "react-router-dom";
import { createShippingOptions, getShippingOptions } from "../apiAdmin";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import { Link } from "react-router-dom/cjs/react-router-dom.min";
import UpdateShippingOptions from "./UpdateShippingOptions";
import styled from "styled-components";
import { useCartContext } from "../../cart_context";

const ShippingOptions = () => {
	const [carrierName, setCarrierName] = useState("");
	const [carrierName_Arabic, setCarrierName_Arabic] = useState("");
	// eslint-disable-next-line
	const [loading, setLoading] = useState("");
	// eslint-disable-next-line
	const [shippingPrice, setShippingPrice] = useState("");
	const [shippingPrice_Unit, setShippingPrice_Unit] = useState("");
	const [selectedOption, setSelectedOption] = useState("");
	const [daysShippingClosed, setDaysShippingClosed] = useState([]);
	const [allShippingOptions, setAllShippingOptions] = useState([]);
	const [allShippingOptions2, setAllShippingOptions2] = useState([]);
	const [cutoffTimes, setCutoffTimes] = useState(["13:00"]);
	const [cutoffHelper, setCutoffHelper] = useState("");
	const [query, setQuery] = useState([]);
	// eslint-disable-next-line
	const [error, setError] = useState(false);
	// eslint-disable-next-line
	const [success, setSuccess] = useState(false);
	const [estimatedDays, setEstimatedDays] = useState([]);
	const { chosenLanguage } = useCartContext();

	// destructure user and token from localstorage
	const { user, token } = isAuthenticated();

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

	const handleChange5 = (e) => {
		setShippingPrice_Unit(e.target.value);
	};

	const handleCutoffTimes = (e) => {
		setCutoffTimes([...cutoffTimes, cutoffHelper]);
		setCutoffHelper("");
	};

	const gettingAllShippingOptions = () => {
		getShippingOptions(token).then((data) => {
			if (data && data.error) {
				setError(data.error);
			} else {
				setError("");
				setAllShippingOptions(
					data &&
						data.map((carrierName) =>
							carrierName.carrierName.toLowerCase().replace(/\s/g, "")
						)
				);
				setAllShippingOptions2(data);
			}
		});
	};

	useEffect(() => {
		gettingAllShippingOptions();
		// eslint-disable-next-line
	}, [carrierName, shippingPrice, carrierName_Arabic]);

	let matchingCarrierName =
		allShippingOptions &&
		allShippingOptions.indexOf(carrierName.toLowerCase().replace(/\s/g, "")) !==
			-1;
	// console.log(matchingCarrierName, "El Logic");
	const clickSubmit = (e) => {
		e.preventDefault();
		if (matchingCarrierName) {
			return toast.error("This Carrier was added before.");
		}

		// Function to validate each time entry
		const isTimeFormatValid = (time) => {
			const regex = /^(2[0-3]|[01]?[0-9]):([0-5]?[0-9])$/;
			return regex.test(time);
		};

		// Check if all cutoffTimes are valid
		const allTimesValid = cutoffTimes.every(isTimeFormatValid);

		if (!allTimesValid) {
			return toast.error(
				"One of the hours you added is not correct, please adjust and try again"
			);
		}

		setError("");
		setSuccess(false);
		// make request to api to create ShippingOption
		createShippingOptions(user._id, token, {
			carrierName,
			carrierName_Arabic,
			shippingPrice,
			shippingPrice_Unit,
			estimatedDays,
			daysShippingClosed: daysShippingClosed.daysShippingClosed,
			cutoffTimes,
		}).then((data) => {
			if (data.error) {
				setError(data.error);
				setTimeout(function () {
					// window.location.reload(false);
				}, 1000);
			} else {
				toast.success("Shipping Option was successfully Added.");
				setError("");
				setTimeout(function () {
					setCarrierName("");
					setCarrierName_Arabic("");
					setShippingPrice("");
					setShippingPrice_Unit("");
					setEstimatedDays("");
					setDaysShippingClosed("");
				}, 2000);
				// setTimeout(function () {
				// 	window.location.reload(false);
				// }, 2500);
			}
		});
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

	const newShippingOptionForm = () => (
		<form onSubmit={clickSubmit}>
			<h3 className='text-center mb-4'> Add Shipping Options</h3>
			<div className='row'>
				<div className='form-group col-md-4 mx-auto'>
					<label className='text-muted'>Carrier/Package Name</label>
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
						onChange={handleChange5}
					>
						{shippingPrice_Unit ? (
							<option value={shippingPrice_Unit}>{shippingPrice_Unit}</option>
						) : (
							<option value=''>Please select</option>
						)}
						<option>Kuwaiti Dinar</option>
						<option>US Dollar</option>
					</select>
				</div>
			</div>
			<div className='row'>
				<div className='form-group col-md-5 mx-auto'>
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

				<div className='form-group col-md-5 mx-auto'>
					<div className='grid-habal'>
						<div>
							<label className='text-muted'>
								Estimated Delivery Time (hour)
							</label>{" "}
							<input
								type='text'
								className='form-control'
								onChange={(e) => setCutoffHelper(e.target.value)}
								value={cutoffHelper}
								placeholder='e.g. 13:00'
							/>
						</div>

						<div className='btn-cutoff' onClick={handleCutoffTimes}>
							Add Times
						</div>
					</div>
				</div>
			</div>
			{cutoffTimes &&
				cutoffTimes.length > 1 &&
				cutoffTimes.map((c, i) => {
					return (
						<span className='mx-2' key={i}>
							{c}
						</span>
					);
				})}
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
			</div>
			<div className='text-center mx-auto w-75'>
				<button className='btn btn-outline-primary mb-3'>
					Add Shipping Option
				</button>
			</div>
		</form>
	);

	return (
		<ShippingOptionsWrapper>
			{!selectedOption ? (
				<>
					<div className=''>
						<ToastContainer />

						{newShippingOptionForm()}
					</div>

					<table className='table table-bordered my-3' dir='ltr'>
						<thead className='thead-light text-center'>
							<tr>
								<th scope='col'>#</th>
								<th scope='col'>Name</th>
								<th scope='col'>Price</th>
								<th scope='col'>ETA</th>
								<th scope='col'>Unavailable Days</th>
								<th scope='col'>Update</th>
							</tr>
						</thead>

						<tbody className='text-center'>
							{allShippingOptions2 &&
								allShippingOptions2.map((s, i) => (
									<tr key={s._id}>
										<td>{i + 1}</td>
										<td>{s.carrierName}</td>
										<td>{s.shippingPrice} KD</td>

										<td>{s.estimatedDays} (Days)</td>
										<td>
											{s.daysShippingClosed.map((d, ii) => (
												<span
													key={ii}
													className='mx-1'
													style={{ fontWeight: "bold" }}
												>
													({d})
												</span>
											))}{" "}
										</td>
										<td>
											<Link
												to='/admin/store-management?shippingoptions'
												onClick={() => {
													setSelectedOption(s);
												}}
											>
												Update
											</Link>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</>
			) : (
				<div>
					<h3 style={{ textAlign: "center" }} className='my-3'>
						Select ({selectedOption && selectedOption.carrierName}) Option
					</h3>
					<div>
						<UpdateShippingOptions
							selectedOption={selectedOption}
							setSelectedOption={setSelectedOption}
							chosenLanguage={chosenLanguage}
						/>
					</div>
				</div>
			)}
		</ShippingOptionsWrapper>
	);
};

export default ShippingOptions;

const ShippingOptionsWrapper = styled.div`
	.grid-habal {
		display: grid;
		grid-template-columns: 85% 15%;
		gap: 5px;
	}

	.btn-cutoff {
		margin-top: 35px;
		background-color: darkblue;
		border-radius: 3px;
		color: white;
		text-align: center;
		padding: 4px 0px !important;
		cursor: pointer;
	}
`;
