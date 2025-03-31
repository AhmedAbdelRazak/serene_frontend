/** @format */

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useHistory, useLocation } from "react-router-dom";
import { Tabs } from "antd";
import AdminNavbar from "../AdminNavbar/AdminNavbar";
import StoreManagement from "./StoreManagement";
import ShippingOptions from "./ShippingOptions";
import { useCartContext } from "../../cart_context";

const { TabPane } = Tabs;

const StoreSettingsMain = () => {
	const [AdminMenuStatus, setAdminMenuStatus] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [activeTab, setActiveTab] = useState("StoreSettings");
	const history = useHistory();
	const location = useLocation(); // needed to watch query params

	const { chosenLanguage } = useCartContext();

	// Collapse navbar if window is small
	useEffect(() => {
		if (window.innerWidth <= 1000) {
			setCollapsed(true);
		}
	}, []);

	// Check query param "tab" to set activeTab on mount/refresh
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const tabParam = params.get("tab");
		if (tabParam) {
			setActiveTab(tabParam);
		} else {
			setActiveTab("StoreSettings");
		}
		// eslint-disable-next-line
	}, [location.search]);

	// Handle switching tabs & updating the URL query param
	const handleTabChange = (tabKey) => {
		setActiveTab(tabKey);
		history.push(`/admin/store-management?tab=${tabKey}`);
	};

	return (
		<StoreSettingsMainWrapper collapsed={collapsed}>
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
						{/* Our custom-styled AntD tabs */}
						<CustomTabs
							activeKey={activeTab}
							onChange={handleTabChange}
							type='card'
							tabBarGutter={0}
						>
							<TabPane tab='Store Settings' key='StoreSettings'>
								<div className='my-3'>
									<h3 className='text-center mb-2'>
										{chosenLanguage === "Arabic"
											? "إعدادات المتجر"
											: "Store Settings"}
									</h3>
									<StoreManagement chosenLanguage={chosenLanguage} />
								</div>
							</TabPane>

							<TabPane tab='Shipping Options' key='ShippingOptions'>
								<div className='my-3'>
									<ShippingOptions />
								</div>
							</TabPane>
						</CustomTabs>
					</div>
				</div>
			</div>
		</StoreSettingsMainWrapper>
	);
};

export default StoreSettingsMain;

/* ============ STYLES ============ */
const StoreSettingsMainWrapper = styled.div`
	overflow-x: hidden;
	margin-top: 80px;
	min-height: 715px;

	.grid-container-main {
		display: grid;
		grid-template-columns: ${(props) =>
			props.collapsed ? "5% 75%" : "17% 75%"};
	}

	.container-wrapper {
		border: 2px solid lightgrey;
		padding: 20px;
		border-radius: 20px;
		background: white;
		margin: 0px 10px;
		transition: var(--main-transition);
	}

	@media (max-width: 1000px) {
		.grid-container-main {
			grid-template-columns: 100%;
		}
	}
`;

/**
 * Matches the “card” style tabs from AdminDashboard.
 * Adjust the colors/variables to match your theme.
 */
const CustomTabs = styled(Tabs)`
	.ant-tabs-nav {
		margin-left: 10px; /* left margin for alignment */
	}

	/* Ensures the tab "cards" touch each other (no spacing) */
	.ant-tabs-tab {
		margin: 0 !important; /* remove default margin */
		padding: 12px 16px;
		font-size: 1rem;
		font-weight: bold;
		border-color: #dec8c8 !important;
		transition: var(--main-transition);
	}

	/* The 'card' style uses borders; remove tab radius so they meet flush */
	&.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab,
	&.ant-tabs-card > div > .ant-tabs-nav .ant-tabs-tab {
		border-radius: 0;
		border: 1px solid var(--border-color-dark);
		border-right-width: 0; /* ensures a continuous chain */
	}

	/* The last tab needs a right border */
	&.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab:last-of-type,
	&.ant-tabs-card > div > .ant-tabs-nav .ant-tabs-tab:last-of-type {
		border-right-width: 1px;
	}

	/* Active tab styling */
	&.ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active,
	&.ant-tabs-card > div > .ant-tabs-nav .ant-tabs-tab-active {
		background-color: var(--primary-color-light);
		border-color: var(--primary-color-dark) !important;
		color: var(--text-color-dark) !important;
	}

	/* Hover effect on tabs */
	.ant-tabs-tab:hover {
		background-color: var(--primary-color-lighter);
		color: var(--text-color-primary);
	}
`;
