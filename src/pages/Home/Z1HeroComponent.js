/** @format */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import Slider from "react-slick";
import AOS from "aos";
import "aos/dist/aos.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { getHomes } from "../../Admin/apiAdmin";

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
		AOS.init({
			duration: 1000, // Animation duration in milliseconds
		});
		localStorage.removeItem("Cleared");
		// eslint-disable-next-line
	}, []);

	const settingsHero = {
		dots: true,
		infinite: true,
		autoplay: true,
		arrows: true,
		speed: 3000,
		slidesToShow: 1,
		slidesToScroll: 1,
		autoplaySpeed: 7000,
		pauseOnHover: true,
		adaptiveHeight: true,
	};

	return (
		<HeroComponentWrapper className='mx-auto text-center'>
			<Slider {...settingsHero}>
				{homePage && homePage.thumbnail && homePage.thumbnail[0] && (
					<Banner>
						<Img
							loading='lazy'
							srcSet={
								homePage &&
								homePage.thumbnail &&
								homePage.thumbnail[0] &&
								homePage.thumbnail[0].url
							}
						/>
						<Overlay />
						<BannerContent data-aos='fade-in' data-aos-delay='1000'>
							<BannerText>
								{homePage && homePage.header1 ? homePage.header1 : ""}
							</BannerText>
							<BannerButton to='/our-products'>Shop Now!</BannerButton>
						</BannerContent>
					</Banner>
				)}

				{homePage && homePage.thumbnail2 && homePage.thumbnail2[0] && (
					<Banner>
						<Img
							loading='lazy'
							srcSet={
								homePage &&
								homePage.thumbnail2 &&
								homePage.thumbnail2[0] &&
								homePage.thumbnail2[0].url
							}
						/>
						<Overlay />
						<BannerContent data-aos='fade-in' data-aos-delay='1000'>
							<BannerText>
								{homePage && homePage.header2 ? homePage.header2 : ""}
							</BannerText>
							<BannerButton to='/our-products'>Shop Now!</BannerButton>
						</BannerContent>
					</Banner>
				)}

				{homePage && homePage.thumbnail3 && homePage.thumbnail3[0] && (
					<Banner>
						<Img
							loading='lazy'
							srcSet={
								homePage &&
								homePage.thumbnail3 &&
								homePage.thumbnail3[0] &&
								homePage.thumbnail3[0].url
							}
						/>
						<Overlay />
						<BannerContent data-aos='fade-in' data-aos-delay='1000'>
							<BannerText>
								{homePage && homePage.header3 ? homePage.header3 : ""}
							</BannerText>
							<BannerButton to='/our-products'>Shop Now!</BannerButton>
						</BannerContent>
					</Banner>
				)}
			</Slider>
		</HeroComponentWrapper>
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
	font-size: 3.5rem;
	font-weight: bolder;
	font-family: "Pacifico", cursive;
	max-width: 80%; /* Ensure the text doesn't wrap unnecessarily */
	white-space: nowrap; /* Prevent text from wrapping */

	@media (max-width: 1000px) {
		font-size: 1.8rem;
		max-width: 100%; /* Ensure the text doesn't wrap unnecessarily */
		white-space: normal; /* Allow wrapping if text can't fit within 80% */
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
