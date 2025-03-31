import React, { useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import { Link } from "react-router-dom";
import {
	FaTimes,
	FaHome,
	FaProductHunt,
	FaUserAlt,
	FaMailBulk,
	FaSignInAlt,
	FaUserPlus,
} from "react-icons/fa";
import { isAuthenticated, signout } from "../auth";
import { useCartContext } from "../cart_context";

/* Keyframes for the fade animations */
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-100%);
  }
`;

const Sidebar = ({
	isSidebarOpen,
	setIsSidebarOpen,
	handleNavLinkClick,
	activeLink,
	setActiveLink,
}) => {
	const { user } = isAuthenticated();
	const { websiteSetup } = useCartContext();
	const firstName = user?.name ? user.name.split(" ")[0] : "";

	useEffect(() => {
		const handleLocationChange = () => {
			const path = window.location.pathname;
			if (path === "/") {
				setActiveLink("home");
			} else if (path === "/our-products") {
				setActiveLink("products");
			} else if (path === "/custom-gifts") {
				setActiveLink("customgifts");
			} else if (path === "/about") {
				setActiveLink("about");
			} else if (path === "/contact") {
				setActiveLink("contact");
			} else {
				setActiveLink("");
			}
		};

		handleLocationChange();
		window.addEventListener("popstate", handleLocationChange);

		return () => {
			window.removeEventListener("popstate", handleLocationChange);
		};
	}, [setActiveLink]);

	const handleSignout = () => {
		signout(() => {
			window.location.href = "/";
		});
	};

	return (
		<>
			{isSidebarOpen && <Overlay onClick={() => setIsSidebarOpen(false)} />}
			<SidebarWrapper $isOpen={isSidebarOpen}>
				<CloseIcon onClick={() => setIsSidebarOpen(false)} />

				{/* Logo (only if we have a URL) */}
				{websiteSetup?.sereneJannatLogo?.url && (
					<LogoContainer $isOpen={isSidebarOpen}>
						{/*
              Aspect-ratio container so the logo never gets cropped.
              Adjust width & aspect-ratio to match your actual logo dimensions.
            */}
						<img
							src={websiteSetup.sereneJannatLogo.url}
							alt='Serene Janat Shop Logo'
							loading='lazy'
						/>
					</LogoContainer>
				)}

				<HorizontalLine />

				<NavContainer>
					<StyledLink
						to='/'
						onClick={() => handleNavLinkClick("home")}
						$isActive={activeLink === "home"}
					>
						<FaHome /> Home
					</StyledLink>

					<StyledLink
						to='/our-products'
						onClick={() => handleNavLinkClick("products")}
						$isActive={activeLink === "products"}
					>
						<FaProductHunt /> Products
					</StyledLink>

					<StyledLink
						to='/custom-gifts'
						onClick={() => handleNavLinkClick("customgifts")}
						$isActive={activeLink === "customgifts"}
					>
						<FaProductHunt /> Custom Gifts
					</StyledLink>

					<StyledLink
						to='/about'
						onClick={() => handleNavLinkClick("about")}
						$isActive={activeLink === "about"}
					>
						<FaUserAlt /> About
					</StyledLink>

					<StyledLink
						to='/contact'
						onClick={() => handleNavLinkClick("contact")}
						$isActive={activeLink === "contact"}
					>
						<FaMailBulk /> Contact Us
					</StyledLink>
				</NavContainer>

				<AuthLinksContainer>
					{user && user.role === 1 ? (
						<>
							<AuthLink to='/admin/dashboard'>
								<FaUserPlus /> <span>Hello {firstName}</span>
							</AuthLink>
							<AuthLink to='#' onClick={handleSignout}>
								Signout
							</AuthLink>
						</>
					) : null}

					{user && user.role === 0 ? (
						<>
							<AuthLink to='/dashboard' onClick={() => setIsSidebarOpen(false)}>
								<FaUserPlus /> <span>Hello {firstName}</span>
							</AuthLink>
							<AuthLink to='#' onClick={handleSignout}>
								Signout
							</AuthLink>
						</>
					) : null}

					{(!user || !user.name) && (
						<>
							<AuthLink
								to='/signin'
								onClick={() => handleNavLinkClick("login")}
								$isActive={activeLink === "login"}
							>
								<FaSignInAlt /> Login
							</AuthLink>
							<AuthLink
								to='/signup'
								onClick={() => handleNavLinkClick("register")}
								$isActive={activeLink === "register"}
							>
								<FaUserPlus /> Register
							</AuthLink>
						</>
					)}
				</AuthLinksContainer>
			</SidebarWrapper>
		</>
	);
};

export default Sidebar;

/* -------------- STYLED COMPONENTS -------------- */

/* Overlay behind the sidebar */
const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 5;
	animation: ${fadeIn} 0.3s ease-in-out;
`;

/* The sidebar container */
const SidebarWrapper = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 300px;
	height: 100vh;
	background: var(--primary-color-darker);
	padding: 20px;
	transform: translateX(${(props) => (props.$isOpen ? "0" : "-100%")});
	transition: transform 0.3s ease;
	z-index: 201;
	display: flex;
	flex-direction: column;
	align-items: center;

	animation: ${(props) =>
		props.$isOpen
			? css`
					${fadeIn} 0.3s ease forwards;
				`
			: css`
					${fadeOut} 0.3s ease forwards;
				`};
`;

const CloseIcon = styled(FaTimes)`
	position: absolute;
	top: 10px;
	right: 10px;
	cursor: pointer;
	color: var(--neutral-light);
	font-size: 20px;
`;

/** Aspect‐ratio container for the logo to prevent cropping.
 *  Adjust width & ratio for your real logo dimensions. */
const LogoContainer = styled.div`
	width: 150px; /* total width of the logo area */
	aspect-ratio: 3 / 1; /* e.g., 3:1 aspect ratio; tweak as needed */
	overflow: hidden;
	margin-top: 20px;
	margin-bottom: 20px;
	padding: 5px;
	border-radius: 5px;
	background-color: var(--neutral-light);

	animation: ${(props) =>
		props.$isOpen
			? css`
					${fadeIn} 1s ease forwards;
				`
			: "none"};

	img {
		width: 100%;
		height: 100%;
		display: block;
		margin: auto;
		object-fit: contain;
	}
`;

const HorizontalLine = styled.div`
	width: 75%;
	height: 2px;
	background-color: var(--neutral-light);
	margin-bottom: 20px;
`;

const NavContainer = styled.div`
	width: 100%;
`;

/* We rename isActive => $isActive for styling consistency */
const StyledLink = styled(Link)`
	display: flex;
	align-items: center;
	gap: 10px;
	color: ${(props) =>
		props.$isActive ? "var(--accent-color-1)" : "var(--neutral-light)"};
	font-size: 18px;
	text-decoration: none;
	padding: 10px;
	margin-bottom: 40px;
	width: 100%;
	text-align: left;
	border-radius: 5px;

	&:hover {
		background-color: var(--accent-color-1);
		color: var(--neutral-dark);
	}
`;

const AuthLinksContainer = styled.div`
	width: 100%;
	margin-top: 20px;

	a {
		text-decoration: underline;
		font-weight: bolder;
		color: var(--neutral-light);
	}
`;

/* Reuse StyledLink for AuthLink */
const AuthLink = styled(StyledLink)`
	display: flex;
	align-items: center;
	gap: 5px;

	span {
		font-size: 16px;
	}
`;
