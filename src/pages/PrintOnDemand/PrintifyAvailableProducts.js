import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import axios from "axios";
import { useHistory } from "react-router-dom";
import Slider from "react-slick";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";
// 1) Import your components:
import PrintifyPageHelmet from "./PrintifyPageHelmet";
import AnimationProductPresentation from "../MyAnimationComponents/AnimationProductPresentation";
import { isAuthenticated } from "../../auth";

// Slick carousel settings
const sliderSettings = {
	dots: true,
	infinite: true,
	speed: 500,
	autoplay: false,
	autoplaySpeed: 9000,
	slidesToShow: 1,
	slidesToScroll: 1,
	pauseOnHover: true,
};

const PrintifyAvailableProducts = () => {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const history = useHistory();
	const { user } = isAuthenticated();
	// Sorting logic function
	const getPriority = (product) => {
		const name = product.productName?.toLowerCase() || "";
		if (name.includes("unisex garment-dyed t-shirt")) {
			return 1;
		}
		if (
			name.includes("bag") ||
			name.includes("shirt") ||
			name.includes("hoodie") ||
			name.includes("clothing")
		) {
			return 2;
		}
		if (name.includes("mug")) {
			return 3;
		}
		// Remainder => 4
		return 4;
	};

	useEffect(() => {
		localStorage.setItem("customGiftModalDismissed", "true");
		localStorage.setItem("customGiftModalDismissed2", "Yes");

		const fetchProducts = async () => {
			try {
				const response = await axios.get(
					`${process.env.REACT_APP_API_URL}/products/pod/print-on-demand-products`
				);
				if (Array.isArray(response.data)) {
					// Sort them right after fetching
					const sortedData = response.data.slice().sort((a, b) => {
						return getPriority(a) - getPriority(b);
					});
					setProducts(sortedData);
				}
			} catch (error) {
				console.error("Error fetching POD products:", error);
			}
			setLoading(false);
		};

		fetchProducts();
	}, []);

	const handleProductClick = (product) => {
		ReactGA.event({
			category: "User Clicked On Product From Custom Design Products",
			action: "User Clicked On Product From Custom Design Products",
			label: `User Clicked On Product From Custom Design Products`,
		});

		const eventId = `print-on-demand-${Date.now()}`;

		ReactPixel.track("Lead", {
			content_name: "User Clicked On Product From Custom Design Products",
			click_type: "Custom Design (Print On Demand)",
			eventID: eventId,
		});

		axios.post(`${process.env.REACT_APP_API_URL}/facebookpixel/conversionapi`, {
			eventName: "Lead",
			eventId,
			email: user?.email || "Unknown", // if you have a user object
			phone: user?.phone || "Unknown", // likewise
			currency: "USD", // not essential for "Lead," but you can pass
			value: 0,
			contentIds: [`cat-print-on-demand`], // or any ID you want
			userAgent: window.navigator.userAgent,
		});

		const printifyId = product._id;
		history.push(`/custom-gifts/${printifyId}`);
	};

	if (loading) {
		return (
			<LoadingContainer>
				<CustomSpinner />
				<LoadingText>Loading Products...</LoadingText>
			</LoadingContainer>
		);
	}

	return (
		<div className='container'>
			{/* 2) Use your new Helmet component here, passing in `products`. */}
			<PrintifyPageHelmet products={products} />

			<Wrapper>
				{/*
          3) Absolutely‐positioned animation with higher z‐index.
             Adjust top/left/width/height as you like.
        */}
				<AbsoluteAnimationWrapper>
					<AnimationProductPresentation />
				</AbsoluteAnimationWrapper>

				<SectionTitle>
					Show you care with a one-of-a-kind gift—add your own text or photo to
					any product for a personal touch they’ll never forget!
				</SectionTitle>

				<GridContainer>
					{products.map((product) => {
						const firstVariantImages =
							product?.productAttributes?.[0]?.productImages || [];
						const fallbackImages = product?.thumbnailImage?.[0]?.images || [];

						const allImages = firstVariantImages.length
							? firstVariantImages
							: fallbackImages;

						// We'll just show up to 5 images in the slider
						const displayImages = allImages.slice(0, 5);

						// Check if it's a POD product and get the example design image
						const isPOD =
							product.isPrintifyProduct && product.printifyProductDetails?.POD;
						const exampleDesignImage =
							product?.productAttributes?.[0]?.exampleDesignImage?.url;

						return (
							<Card
								key={product._id}
								onClick={() => handleProductClick(product)}
							>
								<CarouselWrapper>
									<Slider {...sliderSettings}>
										{displayImages.map((imgObj, idx) => (
											<ImageContainer key={idx}>
												<img
													src={imgObj.url}
													alt={product.productName}
													loading='lazy'
												/>
											</ImageContainer>
										))}
									</Slider>
								</CarouselWrapper>

								{/* 
                  Only show example design overlay if it's a POD product 
                  and there's an example design image.
                */}
								{isPOD && exampleDesignImage && (
									<ExampleDesignOverlay className='exampleDesignOverlay'>
										<img src={exampleDesignImage} alt='Example Design' />
									</ExampleDesignOverlay>
								)}

								<CardBody>
									<TooltipWrapper title={product.productName}>
										<ProductTitle>{product.productName}</ProductTitle>
									</TooltipWrapper>
									<ProductPrice>
										Starting at: $
										{product.priceAfterDiscount?.toFixed(2) ?? "0.00"}
									</ProductPrice>
									<CustomizeButton>Customize</CustomizeButton>
								</CardBody>
							</Card>
						);
					})}
				</GridContainer>
			</Wrapper>
		</div>
	);
};

export default PrintifyAvailableProducts;

/* ----------------------------------
  Styled Components
------------------------------------- */

// 4) This wrapper ensures the animation is positioned absolutely
//    over other elements, with a high z-index:
const AbsoluteAnimationWrapper = styled.div`
	position: absolute;
	top: 10px;
	left: -500px;
	z-index: 9999; /* ensure it's on top */

	@media (max-width: 700px) {
		left: -410px;
		top: 30px;
	}
`;

const Wrapper = styled.section`
	position: relative;
	padding: 40px 20px;
	background-color: var(--neutral-light);
	min-height: 100vh;

	@media (max-width: 900px) {
		padding: 40px 5px;
	}
`;

const spinAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const CustomSpinner = styled.div`
	border: 6px solid var(--neutral-light2);
	border-top: 6px solid var(--secondary-color);
	border-radius: 50%;
	width: 48px;
	height: 48px;
	animation: ${spinAnimation} 1s linear infinite;
`;

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 60vh;
`;

const LoadingText = styled.p`
	margin-top: 12px;
	color: var(--text-color-primary);
`;

const SectionTitle = styled.h1`
	color: var(--secondary-color-darker);
	font-size: 1.8rem;
	margin-top: 5px;
	margin-bottom: 15px;
	font-weight: bolder;
	line-height: 1;
	text-align: center;

	@media (max-width: 900px) {
		font-size: 1rem;
		margin-top: 5px;
		margin-bottom: 20px;
	}
`;

const GridContainer = styled.div`
	display: grid;
	gap: 20px;
	grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
`;

const Card = styled.div`
	background: var(--neutral-light);
	border: 1px solid var(--border-color-light);
	border-radius: 12px;
	box-shadow: var(--box-shadow-light);
	overflow: hidden;
	transition:
		transform 0.3s ease,
		box-shadow 0.3s ease;
	cursor: pointer;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	text-transform: capitalize;
	position: relative; /* Added to position the overlay absolutely */

	&:hover {
		transform: translateY(-8px);
		box-shadow: var(--box-shadow-dark);

		/* Show the example design image on hover */
		.exampleDesignOverlay {
			opacity: 1;
		}
	}
`;

const CarouselWrapper = styled.div`
	width: 100%;
	height: 300px;
	overflow: hidden;

	.slick-list {
		height: 100%;
	}

	.slick-dots {
		position: absolute;
		bottom: 8px;
		width: 100%;
	}

	.slick-dots li {
		margin: 0 4px;
	}

	.slick-dots li button:before {
		font-size: 10px;
		color: var(--text-color-secondary);
	}
`;

const ImageContainer = styled.div`
	width: 100%;
	height: 300px;
	overflow: hidden;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
`;

/* Overlay for the example design image */
const ExampleDesignOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 300px;
	opacity: 0;
	z-index: 2;
	transition: opacity 0.4s ease;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
`;

const CardBody = styled.div`
	padding: 16px;
	text-align: center;
	display: flex;
	flex-direction: column;
	align-items: center;
`;

const TooltipWrapper = styled.div`
	position: relative;
	display: inline-block;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 100%;

	&:hover::after {
		content: attr(title);
		position: absolute;
		left: 0;
		bottom: 120%;
		background: var(--neutral-dark);
		color: white;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		white-space: nowrap;
	}
`;

const ProductTitle = styled.h3`
	font-size: 0.85em;
	font-weight: bold;
	color: var(--text-color-dark);
	margin: 0 0 8px 0;
	max-width: 100%;
`;

const ProductPrice = styled.p`
	font-size: 1em;
	color: var(--text-color-secondary);
	margin: 0;
`;

const CustomizeButton = styled.button`
	margin-top: 12px;
	background: var(--accent-color-2-dark);
	color: var(--text-color-light);
	border: none;
	border-radius: 4px;
	padding: 12px 16px;
	font-size: 1rem;
	cursor: pointer;
	width: 100%;
	transition: var(--main-transition);

	&:hover {
		background: var(--secondary-color-dark);
	}

	&:focus {
		outline: none;
	}
`;
