/** @format */

import React from "react";
import styled from "styled-components";
import imageImage from "../../GeneralImages/UploadImageImage.jpg";

const ImageCard3 = ({
	setAddThumbnail,
	handleImageRemove,
	addThumbnail,
	fileUploadAndResizeThumbNail,
}) => {
	return (
		<ImageCardWrapper>
			<div className='card card-flush py-4'>
				<div className=''>
					<div className=' p-3'>
						<h5
							style={{
								fontWeight: "bold",
								fontSize: "1.05rem",
								textAlign: "center",
							}}
						>
							Home Page Main Thumbnail 3
						</h5>
					</div>
				</div>
				<div className='card-body text-center pt-0'>
					<div
						className='image-input image-input-empty image-input-outline image-input-placeholder mb-3'
						data-kt-image-input='true'
					>
						<div className='image-input-wrapper w-180px h-180px'></div>
						<div className='col-12'>
							{addThumbnail &&
								addThumbnail.images &&
								addThumbnail.images.map((image) => {
									return (
										<div className='m-3 col-6 position-relative'>
											<button
												type='button'
												className='close position-absolute'
												onClick={() => {
													handleImageRemove(image.public_id);
													setAddThumbnail([]);
												}}
												style={{
													color: "white",
													background: "black",
													fontSize: "15px",
													border: "none",
													padding: "0.2rem",
													top: "0",
													right: "0",
													transform: "translate(-120%, -50%)",
												}}
												aria-label='Close'
											>
												<span aria-hidden='true'>&times;</span>
											</button>
											<img
												src={image.url}
												alt='Img Not Found'
												style={{
													width: "130px",
													height: "130px",
													boxShadow: "1px 1px 1px 1px rgba(0,0,0,0.2)",
												}}
												key={image.public_id}
											/>
										</div>
									);
								})}
						</div>
						{!addThumbnail.images ? (
							<label
								className=''
								style={{ cursor: "pointer", fontSize: "0.95rem" }}
							>
								<img src={imageImage} alt='imageUpload' />
								<input
									type='file'
									hidden
									accept='images/*'
									onChange={fileUploadAndResizeThumbNail}
									required
								/>
							</label>
						) : null}
					</div>
					<div className='text-muted fs-7'>
						Set the Home Page thumbnail 3 image. Only *.png, *.jpg and *.jpeg
						image files are accepted
						<br />
						Dimensions (W×H) (1920×602)
					</div>
				</div>
			</div>
		</ImageCardWrapper>
	);
};

export default ImageCard3;

const ImageCardWrapper = styled.div`
	.card {
		border: 1px #f6f6f6 solid !important;
	}
`;
