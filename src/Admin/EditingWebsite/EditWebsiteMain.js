import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import EditHomePage from "./EditHomePage";
import EditContactUsPage from "./EditContactUsPage";
import EditAboutUsPage from "./EditAboutUsPage";
import AdminNavbar from "../AdminNavbar/AdminNavbar";

const EditWebsiteMain = ({ chosenLanguage }) => {
	const [AdminMenuStatus, setAdminMenuStatus] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [activeTab, setActiveTab] = useState("HomePage");

	useEffect(() => {
		if (window.location.search.includes("homepage")) {
			setActiveTab("HomePage");
		} else if (window.location.search.includes("contactus")) {
			setActiveTab("ContactUs");
		} else if (window.location.search.includes("aboutus")) {
			setActiveTab("AboutUs");
		} else {
			setActiveTab("HomePage");
		}
		// eslint-disable-next-line
	}, [activeTab]);

	return (
		<EditWebsiteMainWrapper
			show={collapsed}
			dir={chosenLanguage === "Arabic" ? "rtl" : "ltr"}
		>
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
					<div
						className='mx-auto col-md-10 mx-auto'
						style={{ background: "#8a8a8a", padding: "1px" }}
					>
						<div className='my-2 tab-grid col-md-6 mx-auto'>
							<Tab
								isActive={activeTab === "HomePage"}
								onClick={() => {
									setActiveTab("HomePage");
								}}
							>
								<Link to='/admin/website-management?homepage'>Home Page</Link>
							</Tab>
							<Tab
								isActive={activeTab === "ContactUs"}
								onClick={() => {
									setActiveTab("ContactUs");
								}}
							>
								<Link to='/admin/website-management?contactus'>Contact Us</Link>
							</Tab>
							<Tab
								isActive={activeTab === "AboutUs"}
								onClick={() => {
									setActiveTab("AboutUs");
								}}
							>
								<Link to='/admin/website-management?aboutus'>About Us</Link>
							</Tab>
						</div>
					</div>

					<div className='container-wrapper'>
						{activeTab === "HomePage" ? (
							<EditHomePage chosenLanguage={chosenLanguage} />
						) : activeTab === "ContactUs" ? (
							<EditContactUsPage />
						) : activeTab === "AboutUs" ? (
							<EditAboutUsPage />
						) : null}
					</div>
				</div>
			</div>
		</EditWebsiteMainWrapper>
	);
};

export default EditWebsiteMain;

const EditWebsiteMainWrapper = styled.div`
	overflow-x: hidden;
	/* background: #ededed; */
	margin-top: 80px;
	min-height: 715px;

	.grid-container-main {
		display: grid;
		grid-template-columns: ${(props) =>
			props.show ? "4.5% 95.5%" : "15.2% 84.8%"};
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
