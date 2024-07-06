import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { Dropdown } from "antd";
import {
	UserOutlined,
	LogoutOutlined,
	MailOutlined,
	BellOutlined,
	SettingOutlined,
	GlobalOutlined,
} from "@ant-design/icons";
import { IoChatbubblesOutline } from "react-icons/io5";
import { useCartContext } from "../../cart_context";
import LastAddedLogoImage from "./LastAddedLogoImage";
import iconLogo from "../iconLogo.png";
import {
	getUnassignedSupportCasesCount,
	getUnseenMessagesCountByAdmin,
} from "../apiAdmin";
import socket from "../../Chat/socket";
import { isAuthenticated } from "../../auth";
import ChatSound from "../../Chat/Notification.wav";
import NotificationDropdown from "./NotificationDropdown";

const TopNavbar = ({ onProfileClick, collapsed }) => {
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const { chosenLanguage } = useCartContext();
	const [unassignedCount, setUnassignedCount] = useState(0);
	const [unseenMessagesCount, setUnseenMessagesCount] = useState(0);
	const [notificationVisible, setNotificationVisible] = useState(false);
	const [showNotificationDropdown, setShowNotificationDropdown] =
		useState(false);
	const { token } = isAuthenticated();
	const [isUserInteracted, setIsUserInteracted] = useState(false);
	const newMessageAudio = useMemo(() => new Audio(ChatSound), []);

	useEffect(() => {
		const fetchUnassignedCount = async () => {
			try {
				const response = await getUnassignedSupportCasesCount(token);
				setUnassignedCount(response.count);
				setNotificationVisible(response.count > 0);
			} catch (error) {
				console.error("Error fetching unassigned support cases count", error);
			}
		};

		const fetchUnseenMessagesCount = async () => {
			try {
				const response = await getUnseenMessagesCountByAdmin(token);
				setUnseenMessagesCount(response.count);
			} catch (error) {
				console.error("Error fetching unseen messages count", error);
			}
		};

		fetchUnassignedCount();
		fetchUnseenMessagesCount();

		const handleUserInteraction = () => {
			setIsUserInteracted(true);
		};

		window.addEventListener("click", handleUserInteraction, { once: true });
		window.addEventListener("keydown", handleUserInteraction, { once: true });

		socket.on("newChat", () => {
			fetchUnassignedCount();
			fetchUnseenMessagesCount();
		});

		socket.on("receiveMessage", (message) => {
			if (
				window.location.pathname !== "/admin/customer-service" &&
				isUserInteracted
			) {
				newMessageAudio.play().catch((error) => {
					console.error("Error playing audio:", error);
				});
			}
			fetchUnseenMessagesCount();
		});

		return () => {
			window.removeEventListener("click", handleUserInteraction);
			window.removeEventListener("keydown", handleUserInteraction);
			socket.off("newChat");
			socket.off("receiveMessage");
		};
	}, [token, newMessageAudio, isUserInteracted]);

	const menuItems = [
		{
			key: "profile",
			icon: <UserOutlined />,
			label: "Profile",
		},
		{
			key: "inbox",
			icon: <MailOutlined />,
			label: "Inbox",
		},
		{
			key: "logout",
			icon: <LogoutOutlined />,
			label: "Logout",
		},
	];

	const toggleNotificationDropdown = () => {
		setShowNotificationDropdown(!showNotificationDropdown);
	};

	return (
		<NavbarWrapper>
			<LeftSection>
				<Logo show={collapsed}>
					<LastAddedLogoImage />
				</Logo>
			</LeftSection>
			<RightSection>
				<Icons>
					<IconWrapper style={{ width: "25%" }}>
						<GlobalOutlined className='mx-2' />
						<LanguageText>
							{chosenLanguage === "English" ? "عربي" : "En"}
						</LanguageText>
					</IconWrapper>
					<IconWrapper
						onClick={() =>
							(window.location.href = "/admin/store-management?storesettings")
						}
					>
						<SettingOutlined />
					</IconWrapper>
					<IconWrapper onClick={toggleNotificationDropdown}>
						<BellOutlined />
						{unseenMessagesCount > 0 && (
							<NotificationBadge>{unseenMessagesCount}</NotificationBadge>
						)}
						{showNotificationDropdown && (
							<NotificationDropdown onClose={toggleNotificationDropdown} />
						)}
					</IconWrapper>
					<IconWrapper
						onClick={() => (window.location.href = "/admin/customer-service")}
					>
						<IoChatbubblesOutline />
						{notificationVisible && (
							<NotificationBadge>{unassignedCount}</NotificationBadge>
						)}
					</IconWrapper>
				</Icons>
				<ProfileMenu>
					<Dropdown
						menu={{ items: menuItems }}
						trigger={["click"]}
						open={dropdownOpen}
						onOpenChange={(flag) => setDropdownOpen(flag)}
					>
						<div>
							<Profile onClick={onProfileClick}>
								<img src={iconLogo} alt='Profile' />
								<div>
									<span>The Boss</span>
								</div>
							</Profile>
						</div>
					</Dropdown>
				</ProfileMenu>
			</RightSection>
		</NavbarWrapper>
	);
};

export default TopNavbar;

const NavbarWrapper = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 70px;
	background-color: #1e1e2d;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 20px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	direction: ${(props) => (props.isArabic ? "rtl" : "")} !important;
	z-index: 1000;
`;

const LeftSection = styled.div`
	display: flex;
	align-items: center;
`;

const Logo = styled.div`
	display: flex;
	align-items: center;
	margin-left: ${(props) => (props.show ? "50px" : "")} !important;
	@media (max-width: 750px) {
		display: none;
	}
`;

const RightSection = styled.div`
	display: flex;
	align-items: center;
`;

const Icons = styled.div`
	display: flex;
	align-items: center;
	margin-left: ${(props) => (props.isArabic ? "40px" : "40px")} !important;
	margin-right: ${(props) => (props.isArabic ? "" : "40px")} !important;

	svg {
		font-size: 25px;
		color: #fff;
		cursor: pointer;
	}
`;

const IconWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	background-color: #161621;
	border-radius: 5px;
	margin-left: ${(props) => (props.isArabic ? "20px" : "")} !important;
	margin-right: ${(props) => (props.isArabic ? "" : "20px")} !important;
	cursor: pointer;
`;

const LanguageText = styled.span`
	color: #fff;
	margin-left: 5px;
	font-size: 14px;
`;

const ProfileMenu = styled.div`
	display: flex;
	align-items: center;
`;

const Profile = styled.div`
	display: flex;
	align-items: center;
	cursor: pointer;
	img {
		border-radius: 25%;
	}
	span {
		font-weight: bold;
		color: #fff;
		margin-left: ${(props) => (props.isArabic ? "20px" : "15px")} !important;
		margin-right: ${(props) => (props.isArabic ? "" : "10px")} !important;
	}
	small {
		display: block;
		color: #bbb;
		font-size: 12px;
	}
`;

const NotificationBadge = styled.div`
	position: absolute;
	top: 0;
	right: 0;
	width: 15px;
	height: 15px;
	background-color: red;
	color: white;
	border-radius: 50%;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 12px;
`;
