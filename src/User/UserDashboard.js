import React, { useEffect, useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { getPurchaseHistory } from "../apiCore";
import { isAuthenticated } from "../auth";
import { Layout, Menu } from "antd";
import {
	UserOutlined,
	ShoppingCartOutlined,
	HeartOutlined,
} from "@ant-design/icons";
import OrdersPage from "./OrdersPage";
import UpdateProfilePage from "./UpdateProfilePage";
import ContactCustomerServicePage from "./ContactCustomerServicePage";
import UserWishlist from "./UserWishlist";
import styled from "styled-components";
import { Helmet } from "react-helmet";

const { Sider, Content } = Layout;

const UserDashboard = () => {
	const [collapsed, setCollapsed] = useState(false);
	const [currentPage, setCurrentPage] = useState("orders");
	const [orders, setOrders] = useState([]);
	const { user, token } = isAuthenticated();
	const history = useHistory();
	const location = useLocation();

	useEffect(() => {
		const queryParams = new URLSearchParams(location.search);
		const page = queryParams.get("page");
		if (page) {
			setCurrentPage(page);
		}

		getPurchaseHistory(user._id, token).then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setOrders(data);
			}
		});

		// Check if the user came from the cart page and if the page hasn't been refreshed yet
		const cameFromCart = location.state && location.state.from === "/cart";
		const hasRefreshed = localStorage.getItem("hasRefreshed");

		if (cameFromCart && !hasRefreshed) {
			localStorage.setItem("hasRefreshed", "true");
			window.location.reload();
		}
	}, [location.search, location.state, user._id, token]);

	const toggleCollapse = () => {
		setCollapsed(!collapsed);
	};

	const handleMenuClick = ({ key }) => {
		setCurrentPage(key);
		history.push(`?page=${key}`);
	};

	const renderContent = () => {
		switch (currentPage) {
			case "orders":
				return (
					<>
						{orders && orders.length > 0 ? (
							<OrdersPage orders={orders} />
						) : (
							<>No Orders</>
						)}
					</>
				);
			case "profile":
				return <UpdateProfilePage />;
			case "contact":
				return <ContactCustomerServicePage />;
			case "wishlist":
				return <UserWishlist />;
			default:
				return <OrdersPage orders={orders} />;
		}
	};

	return (
		<UserDashboardWrapper>
			<Helmet>
				{/* <script>
					{`
						gtag('event', 'conversion_event_purchase', {
						  // <event_parameters>
						});
					`}
				</script> */}

				<script>
					{`
						gtag('event', 'conversion_event_purchase');
					`}
				</script>
			</Helmet>
			<Layout style={{ minHeight: "100vh" }}>
				<Sider
					collapsible
					collapsed={collapsed}
					onCollapse={toggleCollapse}
					breakpoint='md'
					width={240}
					collapsedWidth={40}
				>
					<Menu
						theme='dark'
						selectedKeys={[currentPage]}
						mode='inline'
						onClick={handleMenuClick}
					>
						<Menu.Item key='orders' icon={<ShoppingCartOutlined />}>
							Your Orders
						</Menu.Item>
						<Menu.Item key='profile' icon={<UserOutlined />}>
							Update Profile
						</Menu.Item>
						{/* <Menu.Item key='contact' icon={<CustomerServiceOutlined />}>
							Contact Customer Service
						</Menu.Item> */}
						<Menu.Item key='wishlist' icon={<HeartOutlined />}>
							Wish List
						</Menu.Item>
					</Menu>
				</Sider>
				<Layout>
					<Content
						style={{
							margin: "0 16px",
							padding: "24px",
							backgroundColor: "var(--background-light)",
						}}
					>
						{renderContent()}
					</Content>
				</Layout>
			</Layout>
		</UserDashboardWrapper>
	);
};

export default UserDashboard;

const UserDashboardWrapper = styled.div`
	@media (max-width: 800px) {
		.ant-layout-content {
			padding: 10px !important;
		}
	}

	.ant-layout-sider-children {
		background-color: var(--primary-color-darker) !important;
	}

	ul {
		background: var(--primary-color-darker) !important;
	}

	.ant-menu-item-selected {
		background-color: var(--secondary-color) !important;
	}

	.ant-menu-dark .ant-menu-item-selected > a,
	.ant-menu-dark .ant-menu-item-selected > a:hover {
		color: var(--button-font-color) !important;
	}
`;
