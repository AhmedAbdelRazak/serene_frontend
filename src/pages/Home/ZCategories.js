/** @format */

import React from "react";
import Slider from "react-slick";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Card } from "antd";

const ZCategories = ({ allCategories }) => {
	// Settings for the slider
	const settings = {
		dots: true,
		infinite: true,
		autoplay: true,
		autoplaySpeed: 4000,
		speed: 1500,
		slidesToShow: 3,
		slidesToScroll: 3,
		centerMode: true,
		centerPadding: "60px",
		responsive: [
			{
				breakpoint: 1024,
				settings: {
					slidesToShow: 3,
					slidesToScroll: 3,
					infinite: true,
					dots: true,
				},
			},
			{
				breakpoint: 600,
				settings: {
					slidesToShow: 2,
					slidesToScroll: 2,
					initialSlide: 2,
					centerPadding: "30px",
				},
			},
			{
				breakpoint: 480,
				settings: {
					slidesToShow: 1,
					slidesToScroll: 1,
					centerPadding: "25px",
				},
			},
		],
	};

	return (
		<Container>
			<ZCategoriesWrapper>
				<Slider {...settings}>
					{allCategories.map((category) => (
						<CategoryCard
							key={category.categorySlug}
							onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
						>
							<Link to={`/our-products?category=${category.categorySlug}`}>
								{/* Ensure thumbnail exists and has at least one item */}
								{category.thumbnail && category.thumbnail.length > 0 && (
									<CategoryImageWrapper>
										<CategoryImage
											src={category.thumbnail[0].url}
											alt={category.categoryName}
										/>
									</CategoryImageWrapper>
								)}
								<CategoryName>{category.categoryName}</CategoryName>
							</Link>
						</CategoryCard>
					))}
				</Slider>
			</ZCategoriesWrapper>
		</Container>
	);
};

export default ZCategories;

const Container = styled.div`
	background: var(--neutral-light);
	padding: 10px;
	border-radius: 5px;
	margin-top: 50px;
	margin-bottom: 50px;
`;

const ZCategoriesWrapper = styled.div`
	padding: 20px;
	margin: auto;
	max-width: 1200px;

	.slick-slide {
		padding: 10px;
		box-sizing: border-box;
	}

	.slick-dots {
		bottom: -30px;
	}

	.slick-prev:before,
	.slick-next:before {
		color: var(--text-color-dark);
	}

	.slick-dots li button:before {
		color: var(--text-color-dark);
	}

	.ant-card-body {
		padding: 0 !important; /* Remove padding from the card body */
	}
`;

const CategoryCard = styled(Card)`
	border-radius: 10px;
	overflow: hidden;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	transition:
		transform 0.3s ease,
		box-shadow 0.3s ease;
	padding: 0 !important; /* Remove padding from the card */

	&:hover {
		transform: translateY(-10px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
	}
`;

const CategoryImageWrapper = styled.div`
	width: 100%;
	height: 200px;
	overflow: hidden;
	border-radius: 10px 10px 0 0;
`;

const CategoryImage = styled.img`
	width: 100%;
	height: 100%;
	object-fit: fill;
	object-position: center;
`;

const CategoryName = styled.h3`
	text-align: center;
	margin: 0; /* Remove margin from CategoryName */
	padding: 10px 0; /* Add padding to the top and bottom */
	color: var(--text-color-dark);
	font-size: 16px;
	text-transform: capitalize;
	font-weight: bolder;
	cursor: pointer;

	&:hover {
		color: var(--secondary-color);
		text-decoration: underline;
	}
`;
