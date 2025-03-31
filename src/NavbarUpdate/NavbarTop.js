import React, { useState, useCallback, useMemo } from "react";
import styled from "styled-components";
import { FaBars, FaUserPlus } from "react-icons/fa";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { Link, useHistory } from "react-router-dom";
import { isAuthenticated, signout } from "../auth";
import { useCartContext } from "../cart_context";

const Sidebar = React.lazy(() => import("./Sidebar"));
const SidebarCart = React.lazy(() => import("./SidebarCart"));

const NavbarTop = React.memo(() => {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isCartOpen, setIsCartOpen] = useState(false);
	const [activeLink, setActiveLink] = useState("");

	const { user } = isAuthenticated();
	const { openSidebar2, total_items, websiteSetup } = useCartContext();
	const navigate = useHistory();

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
			navigate("/");
		});
	}, [navigate]);

	return (
		<>
			{isSidebarOpen && <Overlay onClick={() => setIsSidebarOpen(false)} />}

			{/* No scroll logic; just a normal Navbar wrapper */}
			<NavbarTopWrapper>
				<MenuIcon onClick={() => setIsSidebarOpen(true)} />

				{websiteSetup?.sereneJannatLogo?.url && (
					<Link to='/' style={{ textDecoration: "none", display: "flex" }}>
						<Logo
							src={websiteSetup.sereneJannatLogo.url}
							alt='Serene Jannat Shop'
						/>
					</Link>
				)}

				<NavLinks
					onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
				>
					{user && user.name && user.role === 1 && (
						<>
							<NavLink
								as={Link}
								to='/admin/dashboard'
								onClick={() => handleNavLinkClick("/admin/dashboard")}
								className={activeLink === "/admin/dashboard" ? "active" : ""}
							>
								<FaUserPlus /> Hello {firstName}
							</NavLink>

							<NavLink
								as={Link}
								to='#signout'
								onClick={(e) => {
									e.preventDefault();
									handleSignout();
								}}
							>
								Signout
							</NavLink>
						</>
					)}
					{user && user.name && user.role === 0 && (
						<>
							<FaUserPlus />
							<NavLink
								as={Link}
								to='/dashboard'
								onClick={() => handleNavLinkClick("/dashboard")}
								className={activeLink === "/dashboard" ? "active" : ""}
							>
								Hello {firstName}
							</NavLink>
							<NavLink
								as={Link}
								to='#signout'
								onClick={(e) => {
									e.preventDefault();
									handleSignout();
								}}
							>
								Signout
							</NavLink>
						</>
					)}
					{(!user || !user.name) && (
						<>
							<NavLink
								as={Link}
								to='/signin'
								onClick={() => handleNavLinkClick("/signin")}
								className={activeLink === "/signin" ? "active" : ""}
							>
								Login
							</NavLink>
							<NavLink
								as={Link}
								to='/signup'
								onClick={() => handleNavLinkClick("/signup")}
								className={activeLink === "/signup" ? "active" : ""}
							>
								Register
							</NavLink>
						</>
					)}
				</NavLinks>

				<CartIcon onClick={() => openSidebar2()} />
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
	/* Normal appearance on wider screens */
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0.5rem 5rem;
	background-color: var(--neutral-light);
	box-shadow: var(--box-shadow-light);

	/* Below 600px, we keep the navbar “sticky” at the top */
	@media (max-width: 600px) {
		/* position: sticky; */
		top: 0;
		z-index: 200;
		/* If you prefer fixed instead of sticky, just replace the above with position: fixed */
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

	@media (min-width: 769px) {
		.menu-icon,
		.cart-icon {
			display: none;
		}
		.logo {
			flex-grow: 0;
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

	@media (max-width: 768px) {
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
