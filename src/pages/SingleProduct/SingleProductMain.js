import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import SingleProductNoVariables from "./SingleProductNoVariables";
import SingleProductWithVariables from "./SingleProductWithVariables";
import { gettingSingleProduct } from "../../apiCore"; // Adjust the path if needed

const SingleProductMain = () => {
	const { productSlug, categorySlug, productId } = useParams();
	const [product, setProduct] = useState(null);
	const [error, setError] = useState(null);
	const [likee, setLikee] = useState(false); // State to manage wishlist status

	useEffect(() => {
		const fetchProduct = async () => {
			try {
				const product = await gettingSingleProduct(
					productSlug,
					categorySlug,
					productId
				);
				setProduct(product);
			} catch (err) {
				setError(err.message);
			}
		};

		fetchProduct();
	}, [productSlug, categorySlug, productId, likee]);

	if (error) {
		return <div>{error}</div>;
	}

	if (!product) {
		return <div>Loading...</div>;
	}

	return (
		<SingleProductMainWrapper>
			{product &&
			product._id &&
			product.productName &&
			product.category &&
			product.category.categoryName ? (
				<>
					{product.addVariables ? (
						<SingleProductWithVariables
							product={product}
							likee={likee}
							setLikee={setLikee}
						/>
					) : (
						<SingleProductNoVariables
							product={product}
							likee={likee}
							setLikee={setLikee}
						/>
					)}
				</>
			) : null}
		</SingleProductMainWrapper>
	);
};

export default SingleProductMain;

const SingleProductMainWrapper = styled.div`
	min-height: 800px;
`;
