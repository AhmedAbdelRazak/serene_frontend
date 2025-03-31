import React from "react";
import Slider from "react-slick";
import styled from "styled-components";

/**
 * Helper to add Cloudinary transformations (f_auto,q_auto).
 * If the URL is not Cloudinary, or it already has transformations,
 * it returns the original URL unchanged.
 */
const getCloudinaryOptimizedUrl = (url) => {
	if (!url?.includes("res.cloudinary.com")) {
		// Not a Cloudinary URL => leave as is
		return url;
	}

	// If we've already added f_auto or q_auto, skip
	if (url.includes("f_auto") || url.includes("q_auto")) {
		return url;
	}

	// Insert transformations right after '/upload/'
	const parts = url.split("/upload/");
	if (parts.length === 2) {
		// Example:
		// original:  https://res.cloudinary.com/.../upload/v123456/serene_janat/...
		// transformed: https://res.cloudinary.com/.../upload/f_auto,q_auto/v123456/serene_janat/...
		return `${parts[0]}/upload/f_auto,q_auto/${parts[1]}`;
	}

	// Fallback
	return url;
};

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
		autoplaySpeed: 4000,
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

						// Insert Cloudinary transformations if possible
						const optimizedUrl = getCloudinaryOptimizedUrl(url);

						return (
							<Slide key={idx}>
								{optimizedUrl ? (
									<BannerImage src={optimizedUrl} alt={`Banner ${idx + 1}`} />
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

/* ============== Same Styling as Before ============== */

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

	.slick-slider {
		width: 100%;
		height: 100%;
	}

	.slick-dots {
		bottom: 10px;
	}

	.slick-prev,
	.slick-next {
		top: 50%;
		transform: translateY(-50%);
		width: 40px;
		height: 40px;
		z-index: 10; /* Ensure arrows are over slides */
		background: var(--primaryBlueDarker);
		color: #fff;
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

	.slick-prev {
		left: 10px;
	}

	.slick-next {
		right: 10px;
	}

	.slick-prev:before,
	.slick-next:before {
		font-family: "slick";
		font-size: 20px;
		line-height: 1;
		opacity: 1;
		color: #fff;
	}

	@media (max-width: 768px) {
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

	@media (max-width: 992px) {
		max-width: 60%;

		h2 {
			font-size: 4rem;
		}
		p {
			font-size: 1rem;
		}
	}

	@media (max-width: 768px) {
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
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
