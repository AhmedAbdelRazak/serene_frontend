import React from "react";
import Slider from "react-slick";
import styled from "styled-components";

const Hero = ({ websiteSetup }) => {
	// Banners array from your global setup
	const banners = websiteSetup?.homeMainBanners || [];

	// React Slick settings
	const settings = {
		dots: true, // show pagination dots
		infinite: true, // loop
		speed: 1000, // slide transition speed (ms)
		slidesToShow: 1,
		slidesToScroll: 1,
		autoplay: true, // auto-play slides
		autoplaySpeed: 4000, // each slide visible for 4s
		arrows: true, // show next/prev arrows
	};

	return (
		<HeroSection>
			<SliderContainer>
				<Slider {...settings}>
					{banners.map((banner, idx) => {
						const {
							url,
							title,
							subTitle,
							buttonTitle,
							btnBackgroundColor,
							pageRedirectURL,
						} = banner;

						return (
							<Slide key={idx}>
								{/* If there's an image URL, show it; otherwise you could show a fallback */}
								{url ? (
									<BannerImage src={url} alt={`Banner ${idx + 1}`} />
								) : (
									<Placeholder>Banner {idx + 1}</Placeholder>
								)}

								{/* Content over the banner */}
								<BannerContent>
									{title && <h2>{title}</h2>}
									{subTitle && <p>{subTitle}</p>}
									{buttonTitle && (
										<a
											href={pageRedirectURL || "#"}
											style={{ backgroundColor: btnBackgroundColor || "#000" }}
											className='banner-btn'
										>
											{buttonTitle}
										</a>
									)}
								</BannerContent>
							</Slide>
						);
					})}
				</Slider>
			</SliderContainer>
		</HeroSection>
	);
};

export default Hero;

const HeroSection = styled.section`
	width: 100%;
	margin: 0 auto;

	@media (max-width: 768px) {
		width: 100%;
		height: auto;
	}
`;

const SliderContainer = styled.div`
	width: 100%;
	height: 100%;
	position: relative; /* crucial for absolutely positioned arrows */

	/* --------------------------------------------
    Some slick classes for customizing dots/arrows
  --------------------------------------------- */
	.slick-slider {
		width: 100%;
		height: 100%;
	}

	.slick-dots {
		bottom: 10px;
	}

	/* 
    ================
    Slick Arrows
    ================
    By default, slick might position them outside the container or
    add negative margins. We'll manually position them so they do
    not create horizontal overflow.
  */
	.slick-prev,
	.slick-next {
		top: 50%;
		transform: translateY(-50%);
		width: 40px;
		height: 40px;
		z-index: 10; /* Ensure arrows are over slides */
		background: var(--primaryBlueDarker);
		color: #fff; /* We'll rely on the pseudo-element for the arrow glyph. */
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.8;
		transition: opacity 0.3s ease;
		cursor: pointer;
	}

	.slick-prev:hover,
	.slick-next:hover {
		opacity: 1;
	}

	/* Use left & right so they don't cause overflow. 
     Adjust the px as you prefer for spacing. */
	.slick-prev {
		left: 10px;
	}

	.slick-next {
		right: 10px;
	}

	/*
    Slick arrows are actually generated via the ::before pseudo-element. 
    Change its font-size, color, etc. as needed:
  */
	.slick-prev:before,
	.slick-next:before {
		font-family: "slick";
		font-size: 20px;
		line-height: 1;
		opacity: 1;
		color: #fff; /* arrow icon color */
	}

	@media (max-width: 768px) {
		/* Make arrows smaller on mobile */
		.slick-prev,
		.slick-next {
			width: 30px;
			height: 30px;
		}
		.slick-prev:before,
		.slick-next:before {
			font-size: 16px;
		}
	}
`;

const Slide = styled.div`
	position: relative;
	width: 100%;
	height: 100%;
	max-height: 700px !important;

	@media (max-width: 768px) {
		/* you can further adjust or remove the height constraints as needed */
	}
`;

const BannerImage = styled.img`
	width: 100%;
	object-fit: cover;
	max-height: 600px;

	@media (max-width: 600px) {
		min-height: 450px !important;
	}
`;

const Placeholder = styled.div`
	background-color: #ccc;
	width: 100%;
	height: 100%;
`;

const BannerContent = styled.div`
	position: absolute;
	top: 50%;
	left: 10%;
	transform: translateY(-50%);
	color: #fff;
	min-width: 40%;
	background-color: rgba(0, 0, 0, 0.3);
	padding: 15px 20px;
	border-radius: 8px;
	text-align: center;

	h2 {
		font-size: 5rem;
		margin-bottom: 1rem;
		font-family: "Allison", cursive;
		font-weight: bolder;
	}

	p {
		font-size: 1.2rem;
		line-height: 1.4;
		margin-bottom: 1rem;
	}

	.banner-btn {
		display: inline-block;
		color: #fff;
		text-decoration: none;
		padding: 0.75rem 1.5rem;
		border-radius: 5px;
		font-weight: bold;
		transition: all 0.3s ease;
		&:hover {
			opacity: 0.8;
		}
	}

	/* Keep desktop look until 992px */
	@media (max-width: 992px) {
		max-width: 60%;

		h2 {
			font-size: 4rem;
		}
		p {
			font-size: 1rem;
		}
	}

	/* Mobile adjustments */
	@media (max-width: 768px) {
		/* Center horizontally and vertically */
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);

		/* Make sure we don't run into the arrows on smaller screens */
		min-width: 85%;

		background-color: rgba(0, 0, 0, 0.5);
		padding: 11px 10px;
		border-radius: 8px;

		h2 {
			font-size: 3rem;
		}
		p {
			font-size: 0.9rem;
		}
	}
`;
