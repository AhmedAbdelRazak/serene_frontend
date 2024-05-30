import React from "react";
import styled from "styled-components";
import imageImage from "../../../GeneralImages/UploadImageImage.jpg";

const ImageCard = ({
	setAddThumbnail,
	handleImageRemove,
	addThumbnail,
	fileUploadAndResizeThumbNail,
	uploadFrom,
}) => {
	const multipleImages =
		addThumbnail && addThumbnail.images && addThumbnail.images.length > 1;

	return (
		<ImageCardWrapper>
			<div className='card card-flush py-4'>
				<div className=''>
					<div className='p-2'>
						<h5 style={{ fontWeight: "bold", fontSize: "1.05rem" }}>
							{uploadFrom === "BasicProduct"
								? "Product Images"
								: "Product Main Image"}
						</h5>
					</div>
				</div>
				<div className='card-body pt-0'>
					<div className='image-container'>
						{addThumbnail &&
							addThumbnail.images &&
							addThumbnail.images.map((image) => (
								<div className='image-wrapper' key={image.public_id}>
									<button
										type='button'
										className='close-btn'
										onClick={() => {
											handleImageRemove(image.public_id);
											setAddThumbnail([]);
										}}
									>
										<span aria-hidden='true'>&times;</span>
									</button>
									<img
										src={image.url}
										alt='Img Not Found'
										className='image'
										style={{
											width: multipleImages ? "100px" : "150px",
											height: multipleImages ? "100px" : "150px",
										}}
									/>
								</div>
							))}
					</div>
					{!addThumbnail.images || addThumbnail.images.length <= 0 ? (
						<label
							className='upload-label'
							style={{ cursor: "pointer", fontSize: "0.95rem" }}
						>
							<img
								src={imageImage}
								alt='imageUpload'
								style={{
									width: "200px",
									height: "200px",
								}}
							/>
							<input
								type='file'
								multiple={uploadFrom === "BasicProduct"}
								hidden
								accept='images/*'
								onChange={fileUploadAndResizeThumbNail}
								required
							/>
						</label>
					) : null}
					<div className='text-muted fs-7'>
						Width: 1200px, Height: 800px;
						<br />
						Set the product thumbnail image. Only *.png, *.jpg and *.jpeg image
						files are accepted
					</div>
				</div>
			</div>
		</ImageCardWrapper>
	);
};

export default ImageCard;

const ImageCardWrapper = styled.div`
	.card {
		border: 1px white solid !important;
		max-width: 90%;
	}

	.image-container {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
	}

	.image-wrapper {
		position: relative;
		margin: 5px;
	}

	.close-btn {
		position: absolute;
		top: -8px;
		right: -8px;
		background-color: #e74c3c; /* Reddish background */
		color: white;
		font-size: 16px;
		border: none;
		border-radius: 50%;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.image {
		box-shadow: 1px 1px 1px 1px rgba(0, 0, 0, 0.2);
	}

	.upload-label {
		display: flex;
		justify-content: center;
		align-items: center;
	}
`;
