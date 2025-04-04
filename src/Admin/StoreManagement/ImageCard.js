// components/ImageCard.js
import React from "react";
import styled from "styled-components";
import imageImage from "../../GeneralImages/UploadImageImage.jpg";

// A universal single-image upload
const ImageCard = ({
	singleImage, // { url, public_id } or null
	setSingleImage, // function to update (if needed)
	fileUploadAndResize,
	handleImageRemove,
	labelWidth = 75, // optional placeholder label image width (%)
	instructions = "Only *.png, *.jpg, *.jpeg accepted",
	imageWidth = 150, // width for the uploaded image container in px
	objectFit = "contain", // or "cover" if you prefer
}) => {
	return (
		<ImageCardWrapper imageWidth={imageWidth} objectFit={objectFit}>
			<div className='card card-flush py-4'>
				<div className='card-body text-center pt-0'>
					<div className='image-input mb-3' data-kt-image-input='true'>
						{/* If we have an image, show it */}
						{singleImage && singleImage.url ? (
							<div className='image-container'>
								<button
									type='button'
									className='close'
									onClick={() => handleImageRemove(singleImage.public_id)}
									aria-label='Close'
								>
									<span aria-hidden='true'>&times;</span>
								</button>

								<img
									src={singleImage.url}
									alt='Uploaded'
									className='thumbnail-image'
								/>
							</div>
						) : (
							// Else show placeholder to upload
							<label
								style={{ cursor: "pointer", fontSize: "0.95rem" }}
								className='upload-label'
							>
								<img
									src={imageImage}
									alt='upload placeholder'
									style={{ width: `${labelWidth}%` }}
								/>
								<input
									type='file'
									hidden
									accept='image/*'
									onChange={fileUploadAndResize}
								/>
							</label>
						)}
					</div>
					<div className='text-muted fs-7'>{instructions}</div>
				</div>
			</div>
		</ImageCardWrapper>
	);
};

export default ImageCard;

const ImageCardWrapper = styled.div`
	.card {
		border: 1px #f6f6f6 solid !important;
		border-radius: 6px;
		padding: 5px;
	}

	.image-container {
		position: relative;
		display: inline-block;
		/* Set a fixed width for the container so the close button can be placed reliably.
       Use the prop 'imageWidth' passed from above for logos vs banners. */
		width: ${(props) => props.imageWidth}px;
		height: auto;
		vertical-align: middle; /* helps center if placed inline */
	}

	.thumbnail-image {
		width: 100%;
		height: auto;
		object-fit: ${(props) => props.objectFit};
		box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.2);
		border-radius: 6px;
	}

	.close {
		position: absolute;
		top: 4px;
		right: 4px;
		background: rgba(0, 0, 0, 0.7);
		color: #fff;
		font-size: 20px;
		line-height: 1;
		border: none;
		cursor: pointer;
		padding: 0 6px;
		border-radius: 50%;
		transition: background 0.2s;
	}

	.close:hover {
		background: rgba(0, 0, 0, 0.9);
	}

	.upload-label {
		display: inline-block;
	}
`;
