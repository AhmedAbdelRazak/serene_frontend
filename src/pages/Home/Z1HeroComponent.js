/** @format */

import React, { useState, useEffect, Suspense } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { getHomes } from "../../Admin/apiAdmin";
import ReactGA from "react-ga4";

const Z1HeroComponent = () => {
	const [homePage, setHomePage] = useState({});

	const gettingAllHomes = () => {
		getHomes().then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setHomePage(data && data[data.length - 1]);
			}
		});
	};

	useEffect(() => {
		gettingAllHomes();
		import("aos").then((AOS) => AOS.init({ duration: 1000 }));
		localStorage.removeItem("Cleared");
		// eslint-disable-next-line
	}, []);

	const settingsHero = {
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
	};

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<HeroComponentWrapper className='mx-auto text-center'>
				<Slider {...settingsHero}>
					{homePage && homePage.thumbnail && homePage.thumbnail[0] && (
						<Banner>
							<Img loading='lazy' srcSet={homePage.thumbnail[0].url} />
							<Overlay />
							<BannerContent data-aos='fade-in' data-aos-delay='1000'>
								<BannerText>{homePage.header1 || ""}</BannerText>
								<BannerButton2
									to='/our-products?offers=jannatoffers'
									onClick={() => {
										ReactGA.event({
											category: "Check Our Offers",
											action: "Check Our Offers",
										});
									}}
								>
									CHECK OUR OFFERS!
								</BannerButton2>
							</BannerContent>
						</Banner>
					)}

					{homePage && homePage.thumbnail2 && homePage.thumbnail2[0] && (
						<Banner>
							<Img loading='lazy' srcSet={homePage.thumbnail2[0].url} />
							<Overlay />
							<BannerContent data-aos='fade-in' data-aos-delay='1000'>
								<BannerText>{homePage.header2 || ""}</BannerText>
								<BannerButton to='/our-products'>SHOP NOW!</BannerButton>
							</BannerContent>
						</Banner>
					)}

					{homePage && homePage.thumbnail3 && homePage.thumbnail3[0] && (
						<Banner>
							<Img loading='lazy' srcSet={homePage.thumbnail3[0].url} />
							<Overlay />
							<BannerContent data-aos='fade-in' data-aos-delay='1000'>
								<BannerText>{homePage.header3 || ""}</BannerText>
								<BannerButton to='/our-products'>SHOP NOW!</BannerButton>
							</BannerContent>
						</Banner>
					)}
				</Slider>
			</HeroComponentWrapper>
		</Suspense>
	);
};

export default Z1HeroComponent;

// Banner style

const Banner = styled.div`
	display: flex;
	flex-direction: column;
	overflow: hidden;
	position: relative;
	width: 100%; /* Take full width */
	height: 50vh; /* 70% of the visible height */

	@media (max-width: 1000px) {
		width: 100%; /* Take full width */
		height: 42vh; /* 70% of the visible height */
	}
`;

const Img = styled.img`
	position: absolute;
	inset: 0;
	width: 100%; /* Take full width */
	height: 100%; /* Take full height */
	object-fit: cover;
	object-position: center; /* Center the image */
`;

const HeroComponentWrapper = styled.div`
	text-align: center;
	background-color: white;
	margin-bottom: 50px;

	.slick-next,
	.slick-prev {
		z-index: 1;
	}

	.slick-prev {
		left: 1%;
	}

	.slick-next {
		right: 1%;
	}

	.slick-prev:before,
	.slick-next:before {
		font-size: 25px;
		color: grey;
		padding: 5px;
		border-radius: 10px;
	}

	.slick-dots li button:before {
		font-size: 15px;
		margin-top: 10px;
	}

	@media (max-width: 1000px) {
		.slick-prev:before,
		.slick-next:before {
			font-size: 20px;
		}
	}
`;

const Overlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.25); /* Dark overlay with opacity */
	z-index: 1;
`;

const BannerContent = styled.div`
	position: absolute;
	top: 25%; /* 25% from the top */
	left: 20%;
	transform: translate(-50%, -50%);
	color: white;
	text-align: center;
	z-index: 2;

	@media (max-width: 700px) {
		position: absolute;
		top: 20%; /* 25% from the top */
		left: 10%;
	}
`;

const BannerText = styled.h1`
	font-family: "Allison", cursive; /* Update the font family */
	font-size: 5rem;
	font-weight: bolder;
	max-width: 80%;
	white-space: nowrap;

	@media (max-width: 1000px) {
		font-size: 3rem;
		max-width: 100%;
		white-space: normal;
	}
`;

const BannerButton = styled(Link)`
	display: inline-block;
	background-color: var(--primary-color-darker);
	color: var(--button-font-color);
	padding: 10px 20px;
	margin-top: 10px;
	border: none;
	border-radius: 5px;
	cursor: pointer;
	font-size: 1rem;
	font-weight: bold;
	text-align: center;
	text-decoration: none;
	transition: var(--main-transition);

	&:hover {
		background-color: var(--primary-color-dark);
		padding: 12px 22px;
		text-decoration: none;
		transition: var(--main-transition);
		color: var(--text-color-light);
	}
`;

const BannerButton2 = styled(Link)`
	display: inline-block;
	background-color: var(--background-dark);
	color: var(--button-font-color);
	padding: 10px 20px;
	margin-top: 10px;
	border: none;
	border-radius: 5px;
	cursor: pointer;
	font-size: 1rem;
	font-weight: bold;
	text-align: center;
	text-decoration: none;
	transition: var(--main-transition);

	&:hover {
		background-color: var(--primary-color-dark);
		padding: 12px 22px;
		text-decoration: none;
		transition: var(--main-transition);
		color: var(--text-color-light);
	}
`;
