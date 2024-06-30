import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { Link, useHistory } from "react-router-dom";
import InstantChat from "./InstantChat";
import HistoryChats from "./HistoryChats";
import AdminNavbar from "../AdminNavbar/AdminNavbar";

const CustomerServiceSupportMain = () => {
	const [AdminMenuStatus, setAdminMenuStatus] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [activeTab, setActiveTab] = useState("InstantSupport");
	const history = useHistory();

	useEffect(() => {
		if (window.innerWidth <= 1000) {
			setCollapsed(true);
		}
	}, []);

	useEffect(() => {
		if (window.location.search.includes("instantsupport")) {
			setActiveTab("InstantSupport");
		} else if (window.location.search.includes("history")) {
			setActiveTab("History");
		} else {
			setActiveTab("InstantSupport");
		}
	}, [activeTab]);

	return (
		<CustomerServiceSupportMainWrapper show={collapsed}>
			<div className='grid-container-main'>
				<div className='navcontent'>
					<AdminNavbar
						fromPage='CustomerService'
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
									isActive={activeTab === "InstantSupport"}
									onClick={() => {
										setActiveTab("InstantSupport");
										history.push("/admin/customer-service?instantsupport");
									}}
								>
									<Link to='/admin/customer-service?instantsupport'>
										Instant Support
									</Link>
								</Tab>
								<Tab
									isActive={activeTab === "History"}
									onClick={() => {
										setActiveTab("History");
										history.push("/admin/customer-service?history");
									}}
								>
									<Link to='/admin/customer-service?history'>History</Link>
								</Tab>
							</div>
						</div>
						{activeTab === "InstantSupport" ? (
							<InstantChat />
						) : (
							<HistoryChats />
						)}
					</div>
				</div>
			</div>
		</CustomerServiceSupportMainWrapper>
	);
};

export default CustomerServiceSupportMain;

const CustomerServiceSupportMainWrapper = styled.div`
	overflow-x: hidden;
	margin-top: 70px;
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
		justify-content: center;
		align-items: center;
		text-align: center;
	}

	@media (max-width: 1400px) {
		background: white;
	}
`;

const Tab = styled.div`
	cursor: pointer;
	margin: 0 3px;
	padding: 15px 5px;
	font-weight: ${(props) => (props.isActive ? "bold" : "bold")};
	background-color: ${(props) => (props.isActive ? "transparent" : "#bbbbbb")};
	box-shadow: ${(props) =>
		props.isActive ? "inset 5px 5px 5px rgba(0, 0, 0, 0.3)" : "none"};
	transition: all 0.3s ease;
	min-width: 25px;
	width: 100%;
	text-align: center;
	z-index: 100;
	font-size: 1.2rem;

	a {
		color: ${(props) => (props.isActive ? "white" : "black")};
	}
`;
