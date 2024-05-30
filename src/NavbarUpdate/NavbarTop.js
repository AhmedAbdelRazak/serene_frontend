import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { FaBars, FaUserPlus } from "react-icons/fa";
import { AiOutlineShoppingCart } from "react-icons/ai";
import Sidebar from "./Sidebar";
import SidebarCart from "./SidebarCart";
import { isAuthenticated, signout } from "../auth";
import { getOnlineStoreData } from "../Global";
import { useCartContext } from "../cart_context";

const NavbarTop = () => {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [activeLink, setActiveLink] = useState("");
	const [storeLogo, setStoreLogo] = useState("");
	const { user } = isAuthenticated();
	// eslint-disable-next-line
	const { openSidebar2, total_items } = useCartContext();

	const handleNavLinkClick = (link) => {
		setActiveLink(link);
		setIsSidebarOpen(false);
	};

	useEffect(() => {
		const fetchData = async () => {
			const url = await getOnlineStoreData();
			setStoreLogo(url);
		};

		fetchData();
	}, []);

	const handleSignout = () => {
		signout(() => {
			window.location.href = "/";
		});
	};
	const firstName = user && user.name ? user.name.split(" ")[0] : "";
	return (
		<>
			{isSidebarOpen && <Overlay onClick={() => setIsSidebarOpen(false)} />}
			<NavbarTopWrapper>
				<MenuIcon onClick={() => setIsSidebarOpen(true)} />
				<Logo
					src={storeLogo}
					alt='Serene Janat Shop'
					onClick={() => (window.location.href = "/")}
				/>
				<NavLinks>
					{user && user.name && user.role === 1 ? (
						<>
							<NavLink href='/admin/dashboard'>
								<FaUserPlus /> Hello {firstName}
							</NavLink>
							<NavLink href='#' onClick={handleSignout}>
								Signout
							</NavLink>
						</>
					) : null}
					{user && user.name && user.role === 0 ? (
						<>
							<FaUserPlus />
							<NavLink href='/dashboard'>Hello {firstName}</NavLink>
							<NavLink href='#' onClick={handleSignout}>
								Signout
							</NavLink>
						</>
					) : null}
					{(!user || !user.name) && (
						<>
							<NavLink href='/signin'>Login</NavLink>
							<NavLink href='/signup'>Register</NavLink>
						</>
					)}
				</NavLinks>
				<CartIcon onClick={() => openSidebar2()} /> {/* Open SidebarCart */}
			</NavbarTopWrapper>
			<Sidebar
				isSidebarOpen={isSidebarOpen}
				setIsSidebarOpen={setIsSidebarOpen}
				handleNavLinkClick={handleNavLinkClick}
				activeLink={activeLink}
				setActiveLink={setActiveLink}
			/>
			<SidebarCart
				isCartOpen={isCartOpen}
				setIsCartOpen={setIsCartOpen}
				from={"NavbarTop"}
			/>
		</>
	);
};

export default NavbarTop;

const NavbarTopWrapper = styled.nav`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 5rem;
	background-color: var(--neutral-light);
	box-shadow: var(--box-shadow-light);

	@media (min-width: 769px) {
		.menu-icon,
		.cart-icon {
			display: none;
		}
		.logo {
			flex-grow: 0;
		}
	}

	@media (max-width: 768px) {
		padding: 0.5rem 0.5rem;
		.nav-links {
			display: none;
		}
		.logo {
			flex-grow: 1;
		}
	}
`;

const Logo = styled.img`
	height: 50px;
	cursor: pointer;
	object-fit: cover !important;
`;

const MenuIcon = styled(FaBars)`
	width: 30px;
	height: 30px;
	cursor: pointer;
	color: var(--primary-color-dark);

	@media (min-width: 769px) {
		display: none;
	}
`;

const CartIcon = styled(AiOutlineShoppingCart)`
	width: 30px;
	height: 30px;
	cursor: pointer;
	color: var(--primary-color-dark);
	@media (min-width: 769px) {
		display: none;
	}
`;

const NavLinks = styled.div`
	display: flex;
	gap: 1rem;
	align-items: center;
	font-weight: bold;
	@media (max-width: 769px) {
		display: none;
	}
`;

const NavLink = styled.a`
	color: var(--primary-color-dark);
	text-decoration: none;
	font-size: 16px;
	font-weight: bolder;

	&:hover {
		color: var(--secondary-color-dark);
	}
`;

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 5;
`;
