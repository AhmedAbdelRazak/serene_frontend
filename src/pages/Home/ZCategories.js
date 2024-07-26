import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Card } from "antd";
import ReactGA from "react-ga4";

const ZCategories = ({ allCategories }) => {
	const handleCategoryClick = (categoryName) => {
		ReactGA.event({
			category: "Category Clicked Home Page",
			action: "User Clicked On Category In Home Page",
			label: `User Clicked on ${categoryName} In The Home Page`,
		});
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<Container>
			<ZCategoriesWrapper>
				{allCategories.map((category) => (
					<CategoryCard
						key={category.categorySlug}
						onClick={() => handleCategoryClick(category.categoryName)}
					>
						<Link to={`/our-products?category=${category.categorySlug}`}>
							{category.thumbnail && category.thumbnail.length > 0 && (
								<CategoryImageWrapper>
									<CategoryImage
										loading='lazy'
										src={category.thumbnail[0].url}
										alt={category.categoryName}
									/>
								</CategoryImageWrapper>
							)}
							<CategoryName>{category.categoryName}</CategoryName>
						</Link>
					</CategoryCard>
				))}
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
	display: flex;
	justify-content: center;
	align-items: center;
`;

const ZCategoriesWrapper = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 20px;
	width: 100%;
	max-width: 1200px;
	padding: 20px;
	margin: auto;

	@media (max-width: 480px) {
		gap: 10px;
		padding: 5px;
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
	flex: 1 1 18%; /* Adjust the size of the cards */

	&:hover {
		transform: translateY(-10px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
	}

	@media (max-width: 1024px) {
		flex: 1 1 28%;
	}

	@media (max-width: 768px) {
		flex: 1 1 45%;
	}

	@media (max-width: 480px) {
		flex: 1 1 calc(50% - 7px); /* Ensure 2 cards per row with 7px gap */
	}
`;

const CategoryImageWrapper = styled.div`
	width: 100%;
	height: 170px;
	overflow: hidden;
	border-radius: 10px 10px 0 0;
	display: flex;
	justify-content: center;
	align-items: center;
`;

const CategoryImage = styled.img`
	width: 100%;
	height: 100%;
	object-fit: cover;
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

	@media (max-width: 1024px) {
		font-size: 14px;
	}

	@media (max-width: 768px) {
		font-size: 14px; /* Slightly larger text on tablets */
	}

	@media (max-width: 480px) {
		font-size: 14px; /* Slightly larger text on cell phones */
	}
`;
