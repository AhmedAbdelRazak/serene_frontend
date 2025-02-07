import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import Slider from "react-slick";
import { Link } from "react-router-dom";
import ReactGA from "react-ga4";
// Make sure to import your API call function (getHomes) from wherever you defined it
import { getHomes } from "../../Admin/apiAdmin";

// Styled Components (you can adjust these as needed)
const HeroComponentWrapper = styled.div`
	text-align: center;
	margin-bottom: 50px;
`;

const Banner = styled.div`
	position: relative;
	width: 100%;
	height: 50vh; /* Adjust based on your design */
	@media (max-width: 1000px) {
		height: 42vh;
	}
`;

const Img = styled.img`
	width: 100%;
	height: 100%;
	object-fit: cover;
	object-position: center;
`;

const Overlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.25);
`;

const BannerContent = styled.div`
	position: absolute;
	top: 25%;
	left: 20%;
	transform: translate(-50%, -50%);
	color: white;
	text-align: center;
	z-index: 2;
	@media (max-width: 700px) {
		top: 20%;
		left: 10%;
	}
`;

const BannerText = styled.h1`
	font-family: "Allison", cursive;
	font-size: 5rem;
	font-weight: bolder;
	max-width: 80%;
	white-space: nowrap;
	@media (max-width: 1000px) {
		font-size: 3rem;
		white-space: normal;
	}
`;

const BannerButton = styled(Link)`
	display: inline-block;
	background-color: var(--background-dark);
	color: var(--button-font-color);
	padding: 10px 20px;
	margin-top: 10px;
	border: none;
	border-radius: 5px;
	font-size: 1rem;
	font-weight: bold;
	text-decoration: none;
	transition: all 0.3s ease;
	&:hover {
		background-color: var(--primary-color-dark);
	}
`;

// The optimized hero component
const Z1HeroComponent = () => {
	const [homePage, setHomePage] = useState(null);

	// Fetch home data on mount
	useEffect(() => {
		const fetchHomeData = async () => {
			try {
				const data = await getHomes();
				if (data && !data.error) {
					// Use the latest home data (adjust as needed)
					setHomePage(data[data.length - 1]);
				}
			} catch (error) {
				console.error("Error fetching home data:", error);
			}
		};
		fetchHomeData();

		// Dynamically import and initialize AOS for animations
		import("aos").then((AOS) => AOS.init({ duration: 1000 }));
		localStorage.removeItem("Cleared");
	}, []);

	// Memoize slider settings so that they don’t reinitialize on every render
	const sliderSettings = useMemo(
		() => ({
			dots: true,
			infinite: true,
			autoplay: true,
			arrows: true,
			speed: 2000,
			slidesToShow: 1,
			slidesToScroll: 1,
			autoplaySpeed: 5000,
			pauseOnHover: true,
			adaptiveHeight: true,
		}),
		[]
	);

	// Build an array of slides from the homePage data for easier mapping.
	const slides = useMemo(() => {
		if (!homePage) return [];
		const arr = [];
		if (homePage.thumbnail && homePage.thumbnail[0]) {
			arr.push({
				image: `${homePage.thumbnail[0].url}?auto=format&fit=max&w=1200`,
				alt: "Serene Jannat Best Offers Of Candles, Gifts, Vases and Decor Votives",
				header: homePage.header1,
				buttonText: "CHECK OUR OFFERS!",
				buttonLink: "/our-products?offers=jannatoffers",
				onClick: () => {
					ReactGA.event({
						category: "Check Our Offers",
						action: "User clicked CHECK OUR OFFERS!",
					});
				},
			});
		}
		if (homePage.thumbnail2 && homePage.thumbnail2[0]) {
			arr.push({
				image: `${homePage.thumbnail2[0].url}?auto=format&fit=max&w=1200`,
				alt: "Serene Jannat Candles And Gifts",
				header: homePage.header2,
				buttonText: "SHOP NOW!",
				buttonLink: "/our-products",
			});
		}
		if (homePage.thumbnail3 && homePage.thumbnail3[0]) {
			arr.push({
				image: `${homePage.thumbnail3[0].url}?auto=format&fit=max&w=1200`,
				alt: "Serene Jannat Candles And Gifts",
				header: homePage.header3,
				buttonText: "Customize Your Gift in 3 Minutes!",
				buttonLink: "/custom-gifts",
			});
		}
		return arr;
	}, [homePage]);

	// Optionally, show nothing or a loader until data is fetched.
	if (!homePage) return null;

	return (
		<HeroComponentWrapper>
			<Slider {...sliderSettings}>
				{slides.map((slide, index) => (
					<Banner key={index}>
						{/* Use <picture> to supply a next-gen WebP version if available */}
						<picture>
							<source srcSet={`${slide.image}&format=webp`} type='image/webp' />
							<Img
								loading='lazy'
								src={slide.image}
								alt={slide.alt}
								width='1200' // specify dimensions to reduce layout shifts
								height='800'
							/>
						</picture>
						<Overlay />
						<BannerContent data-aos='fade-in' data-aos-delay='1000'>
							<BannerText>{slide.header || ""}</BannerText>
							<BannerButton
								to={slide.buttonLink}
								onClick={slide.onClick ? slide.onClick : undefined}
							>
								{slide.buttonText}
							</BannerButton>
						</BannerContent>
					</Banner>
				))}
			</Slider>
		</HeroComponentWrapper>
	);
};

export default React.memo(Z1HeroComponent);
