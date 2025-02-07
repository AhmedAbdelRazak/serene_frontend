import React, { useEffect, useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import { FaBars, FaUserPlus } from "react-icons/fa";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { isAuthenticated, signout } from "../auth";
import { getOnlineStoreData } from "../Global";
import { useCartContext } from "../cart_context";

const Sidebar = React.lazy(() => import("./Sidebar"));
const SidebarCart = React.lazy(() => import("./SidebarCart"));

const NavbarTop = React.memo(() => {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [activeLink, setActiveLink] = useState("");
	const [storeLogo, setStoreLogo] = useState("");
	const [isSticky, setIsSticky] = useState(false); // Sticky navbar state

	const { user } = isAuthenticated();
	const { openSidebar2, total_items } = useCartContext();

	// Memoize the first name to avoid recalculations
	const firstName = useMemo(() => {
		return user && user.name ? user.name.split(" ")[0] : "";
	}, [user]);

	// Memoize nav link click handler
	const handleNavLinkClick = useCallback((link) => {
		setActiveLink(link);
		setIsSidebarOpen(false);
	}, []);

	// Memoize signout handler
	const handleSignout = useCallback(() => {
		signout(() => {
			window.location.href = "/";
		});
	}, []);

	// Fetch the store logo on mount.
	useEffect(() => {
		const fetchData = async () => {
			const url = await getOnlineStoreData();
			setStoreLogo(url);
		};
		fetchData();
	}, []);

	// Add scroll event listener for sticky navbar.
	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 40) {
				setIsSticky(true);
			} else {
				setIsSticky(false);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<>
			{isSidebarOpen && <Overlay onClick={() => setIsSidebarOpen(false)} />}
			<NavbarTopWrapper className={isSticky ? "sticky" : ""}>
				<MenuIcon onClick={() => setIsSidebarOpen(true)} />
				<Logo
					src={storeLogo}
					alt='Serene Jannat Shop'
					onClick={() => (window.location.href = "/")}
				/>
				<NavLinks
					onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
				>
					{user && user.name && user.role === 1 && (
						<>
							<NavLink href='/admin/dashboard'>
								<FaUserPlus /> Hello {firstName}
							</NavLink>
							<NavLink href='#' onClick={handleSignout}>
								Signout
							</NavLink>
						</>
					)}
					{user && user.name && user.role === 0 && (
						<>
							<FaUserPlus />
							<NavLink href='/dashboard'>Hello {firstName}</NavLink>
							<NavLink href='#' onClick={handleSignout}>
								Signout
							</NavLink>
						</>
					)}
					{(!user || !user.name) && (
						<>
							<NavLink href='/signin'>Login</NavLink>
							<NavLink href='/signup'>Register</NavLink>
						</>
					)}
				</NavLinks>
				<CartIcon onClick={() => openSidebar2()} /> {/* Opens SidebarCart */}
				{total_items > 0 && <Badge>{total_items}</Badge>}
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
});

export default NavbarTop;

/* ========== Styled Components ========== */

const NavbarTopWrapper = styled.nav`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 5rem;
	background-color: var(--neutral-light);
	box-shadow: var(--box-shadow-light);
	transition: all 0.3s ease;
	overflow: hidden !important;

	&.sticky {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		/* background-color: var(--primary-color-darker); */
		box-shadow: var(--box-shadow-dark);
	}

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

const Badge = styled.span`
	position: absolute;
	top: 0px;
	right: 0px;
	background: var(--primary-color-darker);
	color: var(--neutral-light);
	border-radius: 50%;
	padding: 1px 6px;
	font-size: 12px;
	font-weight: bold;

	@media (min-width: 769px) {
		display: none;
	}
`;
