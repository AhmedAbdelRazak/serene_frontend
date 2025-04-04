import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Tabs, Button, message } from "antd";
import { useHistory, useLocation } from "react-router-dom";
import AdminNavbar from "../AdminNavbar/AdminNavbar";
import { getStoreManagement, updateStoreManagement } from "../apiAdmin";
import { isAuthenticated } from "../../auth";

// Child components
import StoreBasicInfo from "./StoreBasicInfo";
import StoreLogoSection from "./StoreLogoSection";
import StoreAboutUsBanner from "./StoreAboutUsBanner";
import ShippingOptionsContent from "./ShippingOptionsContent"; // <-- IMPORT

const { TabPane } = Tabs;

const AdminStoreManagementMain = () => {
	const [AdminMenuStatus, setAdminMenuStatus] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [loading, setLoading] = useState(false);

	// For reading/updating the URL in React Router v5
	const history = useHistory();
	const location = useLocation();

	// State for store data
	const [storeData, setStoreData] = useState({
		// initial defaults
		loyaltyPointsAward: 0,
		discountPercentage: 0,
		storePhone: "",
		storeAddress: "",
		onlineServicesFees: 0,
		transactionFeePercentage: 3.5,
		activatePayOnDelivery: false,
		purchaseTaxes: 0,
		freeShippingLimit: 0,
		discountOnFirstPurchase: 0,
		storeLogo: { public_id: "", url: "" },
		storeAboutUsBanner: { public_id: "", url: "", paragraph: "" },
		addStoreName: "",
		daysStoreClosed: [],
		activatePickupInStore: false,
		activatePayOnline: true,
	});

	// Default tab if none is specified
	const defaultTab = "storeLogo";

	// Helper to read ?tab=... from the URL or default to "storeLogo"
	const getActiveTabFromURL = () => {
		const params = new URLSearchParams(location.search);
		return params.get("tab") || defaultTab;
	};

	// Track which tab is active in local state
	const [activeTab, setActiveTab] = useState(getActiveTabFromURL());

	// Auth
	const { user, token } = isAuthenticated();
	const userId = user && user._id;

	// Default values
	const defaultValues = {
		loyaltyPointsAward: 80,
		discountPercentage: 10,
		purchaseTaxes: 3,
		freeShippingLimit: 150,
		discountOnFirstPurchase: 10,
	};

	// Collapse sidebar if screen is small
	useEffect(() => {
		if (window.innerWidth <= 1000) {
			setCollapsed(true);
		}
		fetchStoreManagementData();
		// eslint-disable-next-line
	}, []);

	// If the user navigates (e.g., back/forward) and changes the query param,
	// we want to detect that change and update the tab.
	useEffect(() => {
		setActiveTab(getActiveTabFromURL());
		// eslint-disable-next-line
	}, [location.search]);

	// Fetch store data
	const fetchStoreManagementData = () => {
		setLoading(true);
		getStoreManagement(userId, token)
			.then((res) => {
				setLoading(false);
				if (res && !res.error) {
					// Merge data with defaults & forced fields
					const mergedData = {
						...defaultValues,
						...res,
						transactionFeePercentage: 3.5,
						activatePayOnDelivery: false,
					};
					setStoreData(mergedData);
				} else if (res && res.error) {
					// message.error(res.error);
				}
			})
			.catch((err) => {
				setLoading(false);
				console.error("Error fetching store management:", err);
				// message.error("Failed to load store data");
			});
	};

	// Switch tabs
	const handleTabChange = (newKey) => {
		setActiveTab(newKey);

		// Update ?tab=newKey in the URL using history.push
		const params = new URLSearchParams(location.search);
		params.set("tab", newKey);

		history.push({
			pathname: location.pathname, // keep the same path
			search: params.toString(), // updated query string
		});
	};

	// Save changes
	const handleSaveChanges = () => {
		setLoading(true);
		const finalData = {
			...storeData,
			transactionFeePercentage: 3.5,
			activatePayOnDelivery: false,
		};

		updateStoreManagement(userId, token, finalData)
			.then((res) => {
				setLoading(false);
				if (res && !res.error) {
					message.success("Store management updated successfully!");
					fetchStoreManagementData();
				} else if (res && res.error) {
					message.error(res.error);
				}
			})
			.catch((err) => {
				setLoading(false);
				console.error("Error updating store management:", err);
				message.error("Update failed");
			});
	};

	return (
		<AdminStoreManagementMainWrapper collapsed={collapsed}>
			<div className='grid-container-main'>
				<div className='navcontent'>
					<AdminNavbar
						fromPage='StoreManagement'
						AdminMenuStatus={AdminMenuStatus}
						setAdminMenuStatus={setAdminMenuStatus}
						collapsed={collapsed}
						setCollapsed={setCollapsed}
					/>
				</div>

				<div className='otherContentWrapper'>
					<div className='container-wrapper'>
						<h2>Store Management</h2>

						<StyledTabs
							activeKey={activeTab}
							onChange={handleTabChange}
							type='card'
						>
							<TabPane tab='Store Logo' key='storeLogo'>
								<StoreLogoSection
									storeData={storeData}
									setStoreData={setStoreData}
								/>
							</TabPane>

							<TabPane tab='Basic Info' key='basicInfo'>
								<StoreBasicInfo
									storeData={storeData}
									setStoreData={setStoreData}
								/>
							</TabPane>

							<TabPane tab='About Us Banner' key='aboutUs'>
								<StoreAboutUsBanner
									storeData={storeData}
									setStoreData={setStoreData}
								/>
							</TabPane>

							{/* Only show if storeData._id exists */}
							{storeData._id && (
								<TabPane tab='Shipping Options' key='shippingOptions'>
									<ShippingOptionsContent storeId={storeData._id} />
								</TabPane>
							)}
						</StyledTabs>

						<div style={{ marginTop: 40 }}>
							<Button
								type='primary'
								loading={loading}
								onClick={handleSaveChanges}
							>
								Save Changes
							</Button>
						</div>
					</div>
				</div>
			</div>
		</AdminStoreManagementMainWrapper>
	);
};

export default AdminStoreManagementMain;

/* ====== STYLES ====== */

const AdminStoreManagementMainWrapper = styled.div`
	overflow-x: hidden;
	margin-top: 80px;
	min-height: 715px;

	.grid-container-main {
		display: grid;
		grid-template-columns: ${(props) =>
			props.collapsed ? "5% 95%" : "17% 83%"};
	}

	.container-wrapper {
		border: 2px solid var(--border-color-light);
		padding: 20px;
		border-radius: 20px;
		background: white;
		margin: 0 10px;
		transition: var(--main-transition);
	}

	@media (max-width: 1000px) {
		.grid-container-main {
			grid-template-columns: 100%;
		}
	}
`;

const StyledTabs = styled(Tabs)`
	margin-top: 20px;

	.ant-tabs-tab {
		padding: 10px 16px;
		font-size: 1rem;
		font-weight: 600;
	}

	&.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
		border-radius: 0;
		border: 1px solid #ddd;
		margin: 0 !important;
	}
`;
