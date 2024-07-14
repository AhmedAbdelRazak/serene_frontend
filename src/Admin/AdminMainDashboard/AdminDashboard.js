import React, { useEffect, useState } from "react";
import AdminNavbar from "../AdminNavbar/AdminNavbar";
import styled from "styled-components";
import OrdersOverview from "./OrdersOverview";
import OrdersHistory from "./OrdersHistory";
import OrdersInProgress from "./OrdersInProgress";
import OrderDetailsModal from "./OrderDetailsModal";
import { useHistory } from "react-router-dom";

const AdminDashboard = () => {
	const [AdminMenuStatus, setAdminMenuStatus] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [activeTab, setActiveTab] = useState("OrdersInProgress");
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [selectedOrder, setSelectedOrder] = useState(null);
	const history = useHistory(); // Initialize the history object

	useEffect(() => {
		if (window.innerWidth <= 1000) {
			setCollapsed(true);
		}
		// eslint-disable-next-line
	}, []);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const tab = params.get("tab");
		if (tab) {
			setActiveTab(tab);
		}
		// eslint-disable-next-line
	}, []);

	const showModal = (order) => {
		setSelectedOrder(order);
		setIsModalVisible(true);
	};

	const handleCancel = () => {
		setIsModalVisible(false);
		setSelectedOrder(null);
	};

	const handleTabChange = (tab) => {
		setActiveTab(tab);
		history.push(`/admin/dashboard?tab=${tab}`); // Update URL query parameter
	};

	return (
		<AdminDashboardWrapper show={collapsed}>
			<div className='grid-container-main'>
				<div className='navcontent'>
					<AdminNavbar
						fromPage='AdminDashboard'
						AdminMenuStatus={AdminMenuStatus}
						setAdminMenuStatus={setAdminMenuStatus}
						collapsed={collapsed}
						setCollapsed={setCollapsed}
					/>
				</div>

				<div className='otherContentWrapper'>
					<div className='container-wrapper'>
						<TabGrid>
							<Tab
								isActive={activeTab === "OrdersInProgress"}
								onClick={() => handleTabChange("OrdersInProgress")}
							>
								Orders In Progress
							</Tab>
							<Tab
								isActive={activeTab === "OrdersHistory"}
								onClick={() => handleTabChange("OrdersHistory")}
							>
								Orders History
							</Tab>
							<Tab
								isActive={activeTab === "OrdersOverview"}
								onClick={() => handleTabChange("OrdersOverview")}
							>
								Orders Overview
							</Tab>
						</TabGrid>

						{activeTab === "OrdersOverview" && (
							<OrdersOverview showModal={showModal} />
						)}
						{activeTab === "OrdersHistory" && (
							<OrdersHistory showModal={showModal} />
						)}
						{activeTab === "OrdersInProgress" && (
							<OrdersInProgress showModal={showModal} />
						)}
					</div>
				</div>
			</div>

			<OrderDetailsModal
				isVisible={isModalVisible}
				order={selectedOrder}
				onCancel={handleCancel}
				setIsVisible={setIsModalVisible}
			/>
		</AdminDashboardWrapper>
	);
};

export default AdminDashboard;

const AdminDashboardWrapper = styled.div`
	overflow-x: hidden;
	margin-top: 80px;
	min-height: 715px;

	.grid-container-main {
		display: grid;
		grid-template-columns: ${(props) => (props.show ? "5% 95%" : "17% 83%")};
	}

	.container-wrapper {
		border: 2px solid lightgrey;
		padding: 20px;
		border-radius: 20px;
		background: white;
		margin: 0px 10px;
	}

	@media (max-width: 1400px) {
		background: white;
	}
`;

const TabGrid = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	text-align: center;
	margin-bottom: 16px;
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
	min-width: 100px;
	width: 100%;
	text-align: center;
	font-size: 1.2rem;

	a {
		color: ${(props) => (props.isActive ? "white" : "black")};
	}
`;
