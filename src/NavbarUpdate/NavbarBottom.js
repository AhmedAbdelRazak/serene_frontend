import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { AiOutlineShoppingCart } from "react-icons/ai"; // Import for cart icon
import SidebarCart from "./SidebarCart"; // Import SidebarCart
import { Link } from "react-router-dom";
import { useCartContext } from "../cart_context";

const NavbarBottom = () => {
	const [clickedLink, setClickedLink] = useState("");
	const [isSticky, setIsSticky] = useState(false); // State for sticky navbar
	const { openSidebar2, total_items } = useCartContext();

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 70) {
				setIsSticky(true);
			} else {
				setIsSticky(false);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, []);

	useEffect(() => {
		const handleLocationChange = () => {
			// Matches the current pathname with the link state
			const path = window.location.pathname;
			if (path === "/") {
				setClickedLink("home");
			} else if (path === "/our-products") {
				setClickedLink("products");
			} else if (path === "/about") {
				setClickedLink("about");
			} else if (path === "/contact") {
				setClickedLink("contact");
			} else {
				setClickedLink(""); // No active state if the path doesn't match
			}
		};

		// Call once and also add an event listener for future updates
		handleLocationChange();
		window.addEventListener("popstate", handleLocationChange);

		// Cleanup function to remove event listener
		return () => {
			window.removeEventListener("popstate", handleLocationChange);
		};
	}, []); // Empty dependency array ensures this effect runs only once after the component mounts.

	const handleNavLinkClick = (link) => {
		setClickedLink(link);
	};

	return (
		<>
			<NavbarBottomWrapper className={isSticky ? "sticky" : ""}>
				<NavLinks>
					<NavLink
						isSticky={isSticky}
						to='/'
						onClick={() => handleNavLinkClick("home")}
						className={clickedLink === "home" ? "active" : ""}
					>
						Home
					</NavLink>
					<NavLink
						isSticky={isSticky}
						to='/our-products'
						onClick={() => handleNavLinkClick("products")}
						className={clickedLink === "products" ? "active" : ""}
					>
						Products
					</NavLink>
					<NavLink
						isSticky={isSticky}
						to='/about'
						onClick={() => handleNavLinkClick("about")}
						className={clickedLink === "about" ? "active" : ""}
					>
						About
					</NavLink>
					<NavLink
						isSticky={isSticky}
						to='/contact'
						onClick={() => handleNavLinkClick("contact")}
						className={clickedLink === "contact" ? "active" : ""}
					>
						Contact Us
					</NavLink>
				</NavLinks>
				<CartIconWrapper>
					<CartIcon isSticky={isSticky} onClick={() => openSidebar2()} />
					{total_items > 0 && <Badge>{total_items}</Badge>}
				</CartIconWrapper>
			</NavbarBottomWrapper>
			<SidebarCart from='NavbarBottom' />
		</>
	);
};

export default NavbarBottom;

const NavbarBottomWrapper = styled.nav`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 5rem; // Consistent with your top navbar styling
	background-color: var(--accent-color-2-dark); // Example background color
	color: var(--text-color-secondary);
	transition: all 0.3s ease;

	&.sticky {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		box-shadow: var(--box-shadow-dark);
		background-color: var(--primary-color-darker);
	}

	@media (max-width: 768px) {
		display: none; // This hides the navbar on smaller screens
	}
`;

const NavLinks = styled.div`
	display: flex;
	flex: 1; // Takes up all available space
	justify-content: center; // Centers the links within the nav links div
	align-items: center;
`;

const NavLink = styled(Link)`
	color: ${(props) =>
		props.isSticky ? "var(--neutral-light)" : "var(--text-color-light)"};
	text-decoration: none;
	margin: 0 20px; // Spacing between links
	font-size: 1.1rem;
	font-weight: bolder;
	padding: 10px;
	border-radius: 5px;
	transition:
		background-color 0.3s ease,
		color 0.3s ease; // Smooth transition for hover and active states

	&:hover,
	&.active {
		background-color: var(
			--background-accent
		); // Background color for hover and active states
		color: var(--text-color-dark);
	}
`;

const CartIconWrapper = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	margin-left: auto;
	padding-right: 5rem; // Adjust this value as needed for spacing
`;

const CartIcon = styled(AiOutlineShoppingCart)`
	color: ${(props) =>
		props.isSticky ? "var(--text-color-light)" : "var(--text-color-light)"};
	width: 30px;
	height: 30px;
	cursor: pointer;
`;

const Badge = styled.span`
	position: absolute;
	top: -15px;
	right: 65px;
	background: var(--primary-color-darker);
	color: var(--neutral-light);
	border-radius: 50%;
	padding: 2px 6px;
	font-size: 12px;
	font-weight: bold;
`;
