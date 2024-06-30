/** @format */

// eslint-disable-next-line
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Link, useHistory } from "react-router-dom";
import StoreManagement from "./StoreManagement";
import ShippingOptions from "./ShippingOptions";
import { useCartContext } from "../../cart_context";
import AdminNavbar from "../AdminNavbar/AdminNavbar";

const StoreSettingsMain = () => {
	const [AdminMenuStatus, setAdminMenuStatus] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [activeTab, setActiveTab] = useState("StoreSettings");
	const history = useHistory();

	const { chosenLanguage } = useCartContext();

	useEffect(() => {
		if (window.innerWidth <= 1000) {
			setCollapsed(true);
		}
	}, []);

	useEffect(() => {
		if (window.location.search.includes("storesettings")) {
			setActiveTab("StoreSettings");
		} else if (window.location.search.includes("shippingoptions")) {
			setActiveTab("ShippingOptions");
		} else {
			setActiveTab("StoreSettings");
		}
		// eslint-disable-next-line
	}, [activeTab]);

	return (
		<StoreSettingsMainWrapper show={collapsed}>
			<div className='grid-container-main'>
				<div className='navcontent'>
					<AdminNavbar
						fromPage='StoreSettings'
						AdminMenuStatus={AdminMenuStatus}
						setAdminMenuStatus={setAdminMenuStatus}
						collapsed={collapsed}
						setCollapsed={setCollapsed}
					/>
				</div>

				<div className='otherContentWrapper'>
					<div className='container-wrapper'>
						<div
							className='mx-auto col-md-10 mx-auto'
							style={{ background: "#8a8a8a", padding: "1px" }}
						>
							<div className='my-2 tab-grid col-md-6 mx-auto'>
								<Tab
									isActive={activeTab === "StoreSettings"}
									onClick={() => {
										setActiveTab("StoreSettings");
										history.push("/admin/store-management?storesettings");
									}}
								>
									<Link to='/admin/store-management?storesettings'>
										Store Settings
									</Link>
								</Tab>
								<Tab
									isActive={activeTab === "ShippingOptions"}
									onClick={() => {
										setActiveTab("ShippingOptions");
										history.push("/admin/store-management?shippingoptions");
									}}
								>
									<Link to='/admin/store-management?shippingoptions'>
										Shipping Options
									</Link>
								</Tab>
							</div>
						</div>

						{activeTab === "StoreSettings" ? (
							<div className='container-wrapper my-3'>
								<div className='mb-2'>
									<h3 className='text-center mb-2'>
										{" "}
										{chosenLanguage === "Arabic"
											? "إعدادات المتجر"
											: "Store Settings"}{" "}
									</h3>
									<StoreManagement chosenLanguage={chosenLanguage} />
								</div>
							</div>
						) : (
							<div className='container-wrapper my-3'>
								<div className='mb-2'>
									<ShippingOptions />
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</StoreSettingsMainWrapper>
	);
};

export default StoreSettingsMain;

const StoreSettingsMainWrapper = styled.div`
	overflow-x: hidden;
	/* background: #ededed; */
	margin-top: 80px;
	min-height: 715px;

	.grid-container-main {
		display: grid;
		grid-template-columns: ${(props) => (props.show ? "5% 75%" : "17% 75%")};
	}

	.container-wrapper {
		border: 2px solid lightgrey;
		padding: 20px;
		border-radius: 20px;
		background: white;
		margin: 0px 10px;
	}

	.tab-grid {
		display: flex;
		justify-content: center; /* Aligns children (tabs) in the center */
		align-items: center; /* Centers children vertically */
		text-align: center;
	}

	@media (max-width: 1400px) {
		background: white;
	}
`;

const Tab = styled.div`
	cursor: pointer;
	margin: 0 3px; /* 3px margin between tabs */
	padding: 15px 5px; /* Adjust padding as needed */
	font-weight: ${(props) => (props.isActive ? "bold" : "bold")};
	background-color: ${(props) =>
		props.isActive
			? "transparent"
			: "#bbbbbb"}; /* Light grey for unselected tabs */
	box-shadow: ${(props) =>
		props.isActive ? "inset 5px 5px 5px rgba(0, 0, 0, 0.3)" : "none"};
	transition: all 0.3s ease; /* Smooth transition for changes */
	min-width: 25px; /* Minimum width of the tab */
	width: 100%; /* Full width within the container */
	text-align: center; /* Center the text inside the tab */
	/* Additional styling for tabs */
	z-index: 100;
	font-size: 1.2rem;

	a {
		color: ${(props) => (props.isActive ? "white" : "black")};
	}
`;
