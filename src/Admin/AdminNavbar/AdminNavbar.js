import React, { useState } from "react";
import styled from "styled-components";
import { Link, useHistory, Redirect } from "react-router-dom";
import {
	AreaChartOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	SettingOutlined,
	ImportOutlined,
	CustomerServiceOutlined,
	CreditCardOutlined,
	DollarCircleOutlined,
	ShopOutlined,
	TeamOutlined,
	HomeOutlined,
	TagOutlined,
	ContainerOutlined,
} from "@ant-design/icons";
import { Button, Menu } from "antd";
import LastAddedLogoImage from "./LastAddedLogoImage";
import { signout } from "../../auth";

function getItem(label, key, icon, children, type, className) {
	return {
		key,
		icon,
		children,
		label,
		type,
		className,
	};
}

const handleSignout = (history) => {
	signout(() => {
		history.push("/");
	});
};

const items = [
	getItem(<LastAddedLogoImage />, "StoreLogo"),
	getItem(
		<Link to='/admin/dashboard'>Admin Dashboard</Link>,
		"sub1",
		<HomeOutlined />
	),
	getItem(<Link to='/admin/gender'>Gender</Link>, "sub20", <TagOutlined />),
	getItem(
		<Link to='/admin/categories'>Categories</Link>,
		"sub2",
		<ContainerOutlined />
	),
	getItem(
		<Link to='/admin/subcategories'>Subcategories</Link>,
		"sub3",
		<ShopOutlined />
	),
	getItem(
		<Link to='/admin/attributes'>Attributes</Link>,
		"sub4",
		<AreaChartOutlined />
	),
	getItem(
		<Link to='/admin/products'>Products</Link>,
		"sub6",
		<SettingOutlined />
	),
	getItem(
		<Link to='/admin/store-management'>Store Settings</Link>,
		"sub10",
		<DollarCircleOutlined />
	),
	getItem(
		<Link to='/admin/customer-service'>Customer Service</Link>,
		"sub7",
		<CustomerServiceOutlined />
	),
	getItem(
		<Link to='/admin/website-management'>Website Adjustment</Link>,
		"sub21",
		<SettingOutlined />
	),
	getItem(
		<div className='margin-divider'></div>,
		"divider1",
		null,
		null,
		"divider"
	),
	getItem(
		"Inbound Management",
		"sub13",
		<ImportOutlined />,
		null,
		null,
		"black-bg"
	),
	getItem("CRM", "sub14", <CustomerServiceOutlined />, null, null, "black-bg"),
	getItem("POS & Products", "sub15", <ShopOutlined />, null, null, "black-bg"),
	getItem(
		"Financials",
		"sub16",
		<DollarCircleOutlined />,
		null,
		null,
		"black-bg"
	),
	getItem(
		"Employee Accounts",
		"sub17",
		<TeamOutlined />,
		null,
		null,
		"black-bg"
	),
	getItem(
		<div className='margin-divider'></div>,
		"divider2",
		null,
		null,
		"divider2"
	),
	getItem("Payments", "sub18", <CreditCardOutlined />, null, null, "red-bg"),
	getItem(
		<div style={{ fontWeight: "bold", textDecoration: "underline" }}>
			Signout
		</div>,
		"signout",
		<CreditCardOutlined />,
		null,
		null,
		"reddish-bg"
	),
];

const AdminNavbar = ({
	fromPage,
	setAdminMenuStatus,
	collapsed,
	setCollapsed,
}) => {
	const [clickedOn, setClickedOn] = useState(false);

	const toggleCollapsed = () => {
		setCollapsed(!collapsed);
		setAdminMenuStatus(!collapsed);
	};

	const history = useHistory();

	return (
		<AdminNavbarWrapper
			show={collapsed}
			show2={clickedOn}
			style={{ width: 285 }}
		>
			<Button
				type='primary'
				onClick={toggleCollapsed}
				style={{ marginBottom: 8, textAlign: "center" }}
			>
				{collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
			</Button>
			<Menu
				defaultSelectedKeys={
					fromPage === "AdminDashboard"
						? "sub1"
						: fromPage === "Categories"
							? "sub2"
							: fromPage === "Subcategories"
								? "sub3"
								: fromPage === "Attributes"
									? "sub4"
									: fromPage === "Genders"
										? "sub20"
										: fromPage === "Products"
											? "sub6"
											: fromPage === "CustomerService"
												? "sub7"
												: fromPage === "Vendors"
													? "sub8"
													: fromPage === "StoreSettings"
														? "sub10"
														: fromPage === "Website"
															? "sub21"
															: "sub1"
				}
				defaultOpenKeys={["sub1"]}
				mode='inline'
				theme='dark'
				inlineCollapsed={collapsed}
				items={items}
				onClick={(e) => {
					if (e.key === "signout") {
						handleSignout(history);
					}

					if (e.key === "StoreLogo") {
						setClickedOn(true);
					} else {
						setClickedOn(false);
					}

					return <Redirect to={e.key} />;
				}}
			/>
		</AdminNavbarWrapper>
	);
};

export default AdminNavbar;

const AdminNavbarWrapper = styled.div`
	margin-bottom: 15px;
	background: ${(props) => (props.show ? "" : "#1e1e2d")};
	top: 0px !important;
	z-index: 20000;
	overflow: auto;
	position: absolute;
	padding: 0px !important;
	width: ${(props) => (props.show ? "5% !important" : "")};
	position: fixed;
	top: 0;
	left: 0;
	height: 100vh;

	ul {
		height: 90vh !important;
	}

	.logoClass {
		display: ${(props) => (props.show ? "none" : "block")} !important;
	}

	li {
		font-size: 0.9rem;
		margin-bottom: ${(props) => (props.show ? "20px" : "15px")};
	}

	hr {
		color: white !important;
		background: white !important;
	}

	.ant-menu.ant-menu-inline-collapsed {
		min-height: 850px;
	}

	.ant-menu.ant-menu-dark,
	.ant-menu-dark .ant-menu-sub,
	.ant-menu.ant-menu-dark .ant-menu-sub {
		color: rgba(255, 255, 255, 0.65);
		background: #1e1e2d !important;
	}

	.ant-menu-item-selected {
		background: ${(props) => (props.show2 ? "none !important" : "")};
	}

	.black-bg {
		background-color: #0e0e15 !important;

		&:hover {
			background-color: #001427 !important;
		}
	}

	.red-bg {
		background-color: #270000 !important;

		&:hover {
			background-color: #270000 !important;
		}
	}

	.ant-menu-item-selected {
		background: black !important;
	}

	@media (max-width: 1650px) {
		background: ${(props) => (props.show ? "" : "transparent")};

		ul {
			width: 250px;
			padding: 0px !important;
			margin: 0px !important;
		}

		ul > li {
			font-size: 0.8rem !important;
		}
	}

	@media (max-width: 1200px) {
		width: ${(props) => (props.show ? "20%" : "60%")} !important;

		ul {
			display: ${(props) => (props.show ? "none" : "")};
			margin-top: 0px !important;
			top: 0px !important;
		}

		.ant-menu.ant-menu-dark {
		}

		button {
			margin-top: 5px !important;
		}
	}
`;
