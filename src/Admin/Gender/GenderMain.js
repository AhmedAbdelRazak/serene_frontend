import React, { useEffect, useState } from "react";
import AdminNavbar from "../AdminNavbar/AdminNavbar";
import styled from "styled-components";
import { Link, useHistory } from "react-router-dom";
import UpdateGender from "./UpdateGender";
import { ToastContainer } from "react-toastify";
import AddGender from "./AddGender";

const GenderMain = () => {
	const [AdminMenuStatus, setAdminMenuStatus] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [activeTab, setActiveTab] = useState("AddGender");
	const history = useHistory(); // Initialize the history object

	useEffect(() => {
		if (window.innerWidth <= 1000) {
			setCollapsed(true);
		}
		// eslint-disable-next-line
	}, []);

	useEffect(() => {
		if (window.location.search.includes("addgender")) {
			setActiveTab("AddGender");
		} else if (window.location.search.includes("updategender")) {
			setActiveTab("UpdateGender");
		} else {
			setActiveTab("AddGender");
		}
		// eslint-disable-next-line
	}, [activeTab]);

	return (
		<GenderMainWrapper show={collapsed}>
			<ToastContainer className='toast-top-center' position='top-center' />

			<div className='grid-container-main'>
				<div className='navcontent'>
					<AdminNavbar
						fromPage='Genders'
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
									isActive={activeTab === "AddGender"}
									onClick={() => {
										setActiveTab("AddGender");
										history.push("/admin/gender?addgender"); // Programmatically navigate
									}}
								>
									<Link to='/admin/gender?addgender'>Add Gender</Link>
								</Tab>
								<Tab
									isActive={activeTab === "UpdateGender"}
									onClick={() => {
										setActiveTab("UpdateGender");
										history.push("/admin/gender?updategender");
									}}
								>
									<Link to='/admin/gender?updategender'>Update Gender</Link>
								</Tab>
							</div>
						</div>
						{activeTab === "AddGender" ? <AddGender /> : <UpdateGender />}
					</div>
				</div>
			</div>
		</GenderMainWrapper>
	);
};

export default GenderMain;

const GenderMainWrapper = styled.div`
	overflow-x: hidden;
	/* background: #ededed; */
	margin-top: 80px;
	min-height: 800px;
	padding-bottom: 100px;

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
