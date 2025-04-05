import React from "react";
import Slider from "react-slick";
import styled from "styled-components";

/**
 * Ensures we always insert "f_auto,q_auto,w_1600" into the Cloudinary URL.
 * If it's not a Cloudinary URL, or if it already has transformations,
 * we handle it accordingly.
 */
const getCloudinaryOptimizedUrl = (url) => {
	if (!url?.includes("res.cloudinary.com")) {
		// Not a Cloudinary URL => leave as is
		return url;
	}

	// If it already has f_auto or q_auto, we still ensure w_1600 is inserted
	if (url.includes("f_auto") || url.includes("q_auto")) {
		// If the URL doesn't contain w_\d+, insert w_1600
		if (!/w_\d+/.test(url)) {
			return url
				.replace("/upload/", "/upload/") // optional, ensures path is consistent
				.replace("f_auto,q_auto", "f_auto,q_auto,w_1600");
		}
		return url;
	}

	// Otherwise, insert the transformations right after '/upload/'
	const parts = url.split("/upload/");
	if (parts.length === 2) {
		return `${parts[0]}/upload/f_auto,q_auto,w_1600/${parts[1]}`;
	}

	// Fallback
	return url;
};

const Hero = ({ websiteSetup }) => {
	const banners = websiteSetup?.homeMainBanners || [];

	const settings = {
		dots: true,
		infinite: true,
		speed: 500,
		slidesToShow: 1,
		slidesToScroll: 1,
		autoplay: true,
		autoplaySpeed: 4000,
		arrows: true,
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

						// Cloudinary transforms
						const base1600 = getCloudinaryOptimizedUrl(url);
						const base480 = base1600.replace("w_1600", "w_480");
						const base768 = base1600.replace("w_1600", "w_768");
						const base1200 = base1600.replace("w_1600", "w_1200");

						const isFirstSlide = idx === 0;

						return (
							<Slide key={idx}>
								{base1600 ? (
									<BannerImageWrapper>
										<img
											src={base480}
											srcSet={`
                        ${base480} 480w,
                        ${base768} 768w,
                        ${base1200} 1200w,
                        ${base1600} 1600w
                      `}
											sizes='(max-width: 600px) 480px,
                             (max-width: 1024px) 768px,
                             1600px'
											alt={`Banner ${idx + 1}`}
											loading={isFirstSlide ? "eager" : "lazy"}
											// We can safely pass fetchpriority to a *raw* <img>.
											// styled-components never sees this prop:
											fetchpriority={isFirstSlide ? "high" : undefined}
											decoding='async'
										/>
									</BannerImageWrapper>
								) : (
									<Placeholder>Banner {idx + 1}</Placeholder>
								)}

								{/* Overlaid text/content */}
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

/* ============== Styled Components ============== */

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
	position: relative; /* for absolutely positioned arrows */

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
		z-index: 10; /* ensures arrows are over slides */
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
`;

/**
 * Instead of styled.img, we wrap a normal <img> inside:
 * This ensures "fetchpriority" won't trigger styled-components warnings.
 */
const BannerImageWrapper = styled.div`
	width: 100%;
	max-height: 700px;
	overflow: hidden;

	img {
		width: 100%;
		height: auto;
		object-fit: cover;

		@media (max-width: 600px) {
			min-height: 450px !important;
		}
	}
`;

const Placeholder = styled.div`
	background-color: #ccc;
	width: 100%;
	height: 100%;
	min-height: 400px;
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
