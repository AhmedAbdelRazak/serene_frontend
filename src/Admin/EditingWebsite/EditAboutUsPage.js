/** @format */

import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { isAuthenticated } from "../../auth/index";
import axios from "axios";
import { createAbout, getAbouts, cloudinaryUpload1 } from "../apiAdmin";
import { ToastContainer, toast } from "react-toastify";
import ReactQuill from "react-quill";

const toolbarOptions = [
	[{ header: [1, 2, 3, 4, 5, 6, false] }],
	["bold", "italic", "underline", "strike", { color: [] }],
	[{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
	["link", "image", "video"],
	["clean"],
];

const EditAboutUsPage = () => {
	//Adding Variables
	const [header_1, setHeader1] = useState("");
	const [header_1_Arabic, setHeader1_Arabic] = useState("");
	const [description_1, setDescription1] = useState("");
	const [description_1_Arabic, setDescription1_Arabic] = useState("");
	const [allAbouts, setAllAbouts] = useState([]);
	const [addThumbnail, setAddThumbnail] = useState([]);

	// eslint-disable-next-line
	const [loading, setLoading] = useState("");
	// eslint-disable-next-line
	const [error, setError] = useState(false);
	// eslint-disable-next-line
	const [success, setSuccess] = useState(false);
	const { user, token } = isAuthenticated();

	const handleChange2 = (e) => {
		setError("");
		setHeader1(e.target.value);
		setHeader1_Arabic(e.target.value);
	};

	const gettingAllAbouts = () => {
		getAbouts(token).then((data) => {
			if (data.error) {
				setError(data.error);
			} else {
				setError("");
				var lastAdded = data[data.length - 1];
				setAllAbouts(lastAdded);
				setHeader1(lastAdded && lastAdded.header_1);
				setHeader1_Arabic(lastAdded && lastAdded.header_1_Arabic);
				setDescription1(lastAdded && lastAdded.description_1);
				setDescription1_Arabic(lastAdded && lastAdded.description_1_Arabic);
				setAddThumbnail(
					lastAdded && lastAdded.thumbnail
						? { images: lastAdded.thumbnail }
						: []
				);
			}
		});
	};

	const fileUploadAndResizeThumbNail = (e) => {
		let files = e.target.files;
		let updatedThumbnails = [...(addThumbnail.images || [])]; // Initialize with an empty array if addThumbnail.images is undefined

		if (files) {
			for (let i = 0; i < files.length; i++) {
				// Check file size in MB
				let fileSizeInMB = files[i].size / 1024 / 1024;

				// If file size is greater than or equal to 1 MB, display a toast error
				if (fileSizeInMB >= 1) {
					toast.error(
						`Image #${i + 1} is more than 1MB, please try another one`
					);
					continue; // Skip this file and move to the next
				}

				let reader = new FileReader();
				reader.readAsDataURL(files[i]);

				reader.onload = (event) => {
					let img = new Image();
					img.src = event.target.result;

					img.onload = () => {
						// Set the maximum dimensions for the resized image
						const maxWidth = 720;
						const maxHeight = 720;

						let width = img.width;
						let height = img.height;

						// Calculate the aspect ratio to maintain the image's proportions
						if (width > height) {
							if (width > maxWidth) {
								height *= maxWidth / width;
								width = maxWidth;
							}
						} else {
							if (height > maxHeight) {
								width *= maxHeight / height;
								height = maxHeight;
							}
						}

						// Set canvas dimensions to the calculated size
						let canvas = document.createElement("canvas");
						canvas.width = width;
						canvas.height = height;

						// Draw the resized image onto the canvas
						let ctx = canvas.getContext("2d");
						ctx.drawImage(img, 0, 0, width, height);

						// Convert the canvas to a base64 string
						let uri = canvas.toDataURL("image/jpeg", 1);

						// Upload the image to Cloudinary
						cloudinaryUpload1(user._id, token, { image: uri })
							.then((data) => {
								updatedThumbnails.push(data); // Add the new image data
								setAddThumbnail({ images: updatedThumbnails }); // Update the state with the new array
							})
							.catch((err) => {
								console.log("CLOUDINARY UPLOAD ERR", err);
							});
					};
				};
			}
		}
	};

	const FileUploadThumbnail = () => {
		return (
			<>
				<label
					className='btn btn-info btn-raised'
					style={{ cursor: "pointer", fontSize: "0.95rem" }}
				>
					Add a Thumbnail
					<input
						type='file'
						hidden
						accept='images/*'
						onChange={fileUploadAndResizeThumbNail}
					/>
				</label>
			</>
		);
	};

	const handleImageRemove = (public_id) => {
		setLoading(true);
		// console.log("remove image", public_id);
		axios
			.post(
				`${process.env.REACT_APP_API_URL}/admin/removeimage/${user._id}`,
				{ public_id },
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			)
			.then((res) => {
				setLoading(false);
				// eslint-disable-next-line
				const { images } = addThumbnail;
				// let filteredImages = images.filter((item) => {
				// 	return item.public_id !== public_id;
				// });
				setAddThumbnail([]);
			})
			.catch((err) => {
				console.log(err);
				setLoading(false);
				setTimeout(function () {
					window.location.reload(false);
				}, 1000);
			});
	};

	useEffect(() => {
		gettingAllAbouts();
		// eslint-disable-next-line
	}, []);

	const clickSubmit = (e) => {
		e.preventDefault();

		setError("");
		setSuccess(false);
		// make request to api to create Category
		createAbout(user._id, token, {
			header_1,
			header_1_Arabic,
			description_1,
			description_1_Arabic,
			thumbnail:
				addThumbnail && addThumbnail.images !== undefined
					? addThumbnail && addThumbnail.images
					: allAbouts && allAbouts.thumbnail,
		}).then((data) => {
			if (data.error) {
				setError(data.error);
				setTimeout(function () {
					window.location.reload(false);
				}, 1000);
			} else {
				toast.success("About Us was successfully Added.");
				setError("");
				setTimeout(function () {
					setAddThumbnail([]);
				}, 2000);
				setTimeout(function () {
					window.location.reload(false);
				}, 2500);
			}
		});
	};

	function handlePaste(e) {
		const clipboardData = e.clipboardData || window.clipboardData;
		if (clipboardData && clipboardData.getData) {
			const content = clipboardData.getData("text/html");
			const div = document.createElement("div");
			div.innerHTML = content;
			document.execCommand("insertHTML", false, div.innerHTML);
			e.preventDefault();
		}
	}

	function handleEditorChange(content, delta, source, editor) {
		const html = editor.getHTML();
		setDescription1(html);
	}

	const newAboutForm = () => (
		<form onSubmit={clickSubmit}>
			<div className='form-group' dir='ltr'>
				<label className='text-muted'>Add Header For About Us</label>
				<input
					type='text'
					className='form-control'
					onChange={handleChange2}
					value={header_1}
					required
				/>
			</div>

			<div className='col-md-10 mx-auto'>
				<div className='form-group' dir='ltr'>
					<label className=''>Add Description (Required In English)</label>
					<>
						<ReactQuill
							value={description_1}
							onChange={handleEditorChange}
							modules={{
								toolbar: { container: toolbarOptions },
								clipboard: { matchVisual: false },
							}}
							onPaste={handlePaste}
							style={{ height: "200px" }} // Adjust the height value as needed
						/>
					</>
				</div>
			</div>
			<div className='py-5'>
				<button className='btn btn-outline-primary mb-3'>Submit Changes</button>
			</div>
		</form>
	);

	return (
		<div>
			<EditAboutUsPageWrapper>
				<div
					className='col-md-9 mx-auto py-3'
					// style={{ border: "solid red 1px" }}
				>
					<h3 className='mt-1 mb-3 text-center'>Change "About Us" Page</h3>
					<ToastContainer />
					<div className='m-3 col-4'>
						<div className='col-12'>
							{addThumbnail &&
								addThumbnail.images &&
								addThumbnail.images.map((image, i) => {
									return (
										<div className='m-3 col-6 ' key={i}>
											<button
												type='button'
												className='close'
												onClick={() => {
													handleImageRemove(image.public_id);
													setAddThumbnail([]);
												}}
												style={{
													color: "white",
													background: "black",
													fontSize: "20px",
												}}
												aria-label='Close'
											>
												<span aria-hidden='true'>&times;</span>
											</button>
											<img
												src={image.url}
												alt='Img Not Found'
												style={{
													width: "90px",
													height: "90px",
													boxShadow: "1px 1px 1px 1px rgba(0,0,0,0.2)",
												}}
												key={image.public_id}
											/>
										</div>
									);
								})}
						</div>
						{FileUploadThumbnail()}
					</div>
					{newAboutForm()}
				</div>
			</EditAboutUsPageWrapper>
		</div>
	);
};

export default EditAboutUsPage;

const EditAboutUsPageWrapper = styled.div`
	margin-bottom: 100px;
`;
