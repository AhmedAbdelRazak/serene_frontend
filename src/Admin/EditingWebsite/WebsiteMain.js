import React, { useState, useEffect } from "react";
import styled from "styled-components";
import AdminNavbar from "../AdminNavbar/AdminNavbar";
import { Tabs, Button, message } from "antd";
import { getWebsiteSetup, updateWebsiteSetup } from "../apiAdmin";

// Child components
import HomeSection from "./HomeSection";
import HomeExtraSections from "./HomeExtraSections";
import ContactUsSection from "./ContactUsSection";
import AboutUsSection from "./AboutUsSection";
import TermsGuestsSection from "./TermsGuestsSection";
import TermsB2BSection from "./TermsB2BSection";
import ReturnsAndRefundSection from "./ReturnsAndRefundSection";
import { isAuthenticated } from "../../auth";

const { TabPane } = Tabs;

const WebsiteMain = () => {
	const [collapsed, setCollapsed] = useState(false);
	const [AdminMenuStatus, setAdminMenuStatus] = useState(false);

	const [websiteData, setWebsiteData] = useState({
		sereneJannatLogo: {},
		homeMainBanners: [],
		homePageSections: [],
		contactUsPage: {},
		aboutUsBanner: {},
		termsAndCondition: "",
		termsAndCondition_B2B: "",
		returnsAndRefund: "",
		deactivateOrderCreation: "",
		aiAgentToRespond: "",
		deactivateChatResponse: "",
	});

	// We'll default to "home" if no stored tab
	const storedTab = localStorage.getItem("websiteActiveTab") || "home";
	const [activeTab, setActiveTab] = useState(storedTab);

	const [loading, setLoading] = useState(false);

	const { user, token } = isAuthenticated();
	const userId = user._id;

	useEffect(() => {
		// Collapse for mobile
		if (window.innerWidth <= 1000) {
			setCollapsed(true);
		}

		// Attempt to fetch the doc from the backend
		fetchWebsiteData();
		// eslint-disable-next-line
	}, []);

	// Fetch single website doc
	const fetchWebsiteData = () => {
		setLoading(true);
		getWebsiteSetup(userId, token)
			.then((res) => {
				setLoading(false);
				if (res && !res.error) {
					setWebsiteData(res);
				} else if (res && res.error) {
					message.error(res.error);
				}
			})
			.catch((err) => {
				setLoading(false);
				console.error("Error fetching website setup:", err);
				message.error("Failed to load website data");
			});
	};

	// Switch tabs & store in localStorage
	const handleTabChange = (key) => {
		setActiveTab(key);
		localStorage.setItem("websiteActiveTab", key);
	};

	// Save changes to backend, then refetch to sync
	const handleSaveChanges = () => {
		setLoading(true);
		updateWebsiteSetup(userId, token, websiteData)
			.then((res) => {
				setLoading(false);
				if (res && !res.error) {
					message.success("Website setup updated successfully!");
					// Now refetch to ensure local data is the updated doc
					fetchWebsiteData();
				} else if (res && res.error) {
					message.error(res.error);
				}
			})
			.catch((err) => {
				setLoading(false);
				console.error("Error updating website setup:", err);
				message.error("Update failed");
			});
	};

	return (
		<WebsiteMainWrapper show={collapsed}>
			<div className='grid-container-main'>
				<div className='navcontent'>
					<AdminNavbar
						fromPage='Website'
						AdminMenuStatus={AdminMenuStatus}
						setAdminMenuStatus={setAdminMenuStatus}
						collapsed={collapsed}
						setCollapsed={setCollapsed}
					/>
				</div>

				<div className='otherContentWrapper'>
					<div className='container-wrapper'>
						<h2 style={{ marginBottom: "20px" }}>Website Basic Setup</h2>

						{/* Use CustomTabs styled similarly to AdminDashboard */}
						<CustomTabs
							activeKey={activeTab}
							onChange={handleTabChange}
							type='card'
							tabBarGutter={0}
						>
							<TabPane tab='Home' key='home'>
								<HomeSection
									websiteData={websiteData}
									setWebsiteData={setWebsiteData}
								/>
							</TabPane>

							<TabPane tab='Home Extra' key='homeExtra'>
								<HomeExtraSections
									websiteData={websiteData}
									setWebsiteData={setWebsiteData}
								/>
							</TabPane>

							<TabPane tab='About Us' key='about'>
								<AboutUsSection
									websiteData={websiteData}
									setWebsiteData={setWebsiteData}
								/>
							</TabPane>

							<TabPane tab='Contact Us' key='contact'>
								<ContactUsSection
									websiteData={websiteData}
									setWebsiteData={setWebsiteData}
								/>
							</TabPane>

							<TabPane tab='T&C (Clients)' key='tcGuests'>
								<TermsGuestsSection
									websiteData={websiteData}
									setWebsiteData={setWebsiteData}
								/>
							</TabPane>

							<TabPane tab='T&C (B2B)' key='tcB2B'>
								<TermsB2BSection
									websiteData={websiteData}
									setWebsiteData={setWebsiteData}
								/>
							</TabPane>

							<TabPane tab='Returns & Refund' key='returns'>
								<ReturnsAndRefundSection
									websiteData={websiteData}
									setWebsiteData={setWebsiteData}
								/>
							</TabPane>
						</CustomTabs>

						<div style={{ marginTop: "60px" }}>
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
		</WebsiteMainWrapper>
	);
};

export default WebsiteMain;

/* ====================== STYLES ====================== */
const WebsiteMainWrapper = styled.div`
	min-height: 300px;
	overflow-x: hidden;
	margin-top: 90px;

	.grid-container-main {
		display: grid;
		grid-template-columns: ${(props) => (props.show ? "5% 75%" : "17% 75%")};
	}

	.container-wrapper {
		border: 2px solid lightgrey;
		padding: 20px;
		border-radius: 20px;
		background: var(--mainWhite);
		margin: 0px 10px;
		width: 100%;
	}

	@media (max-width: 1000px) {
		.grid-container-main {
			grid-template-columns: 100%;
		}
	}
`;

/**
 * CustomTabs replicates the "card" style and custom styling
 * used in the AdminDashboard component.
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
		border-right-width: 0; /* ensures a continuous border chain */
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
