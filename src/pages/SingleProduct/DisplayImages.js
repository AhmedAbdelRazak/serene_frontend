import React from "react";
import styled from "styled-components";
import { Carousel } from "antd";

const DisplayImages = ({ images }) => {
	return (
		<ImageCarousel>
			<Carousel>
				{images.map((img, index) => (
					<img key={index} src={img} alt={`Product view ${index + 1}`} />
				))}
			</Carousel>
		</ImageCarousel>
	);
};

export default DisplayImages;

const ImageCarousel = styled.div`
	img {
		width: 100%;
		height: 700px; /* Adjust this height as necessary */
		object-fit: contain; /* Ensure the whole image is displayed without distortion */
		border-radius: 5px;
	}

	.ant-carousel .slick-dots li {
		width: 30px; /* Line width */
		height: 2px; /* Line height */
		background-color: #fbeeee !important;
		border: none;
		margin: 0 2px;
		cursor: pointer;
		transition: background-color 0.6s ease;

		&.slick-active {
			background-color: #f6dede !important;
		}

		button {
			width: 100%;
			height: 100%;
			opacity: 0; /* Hide the default dot */
		}
	}
`;
