/** @format */

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { isAuthenticated } from "../../auth/index";
import axios from "axios";
import { createHomePage, getHomes, cloudinaryUpload1 } from "../apiAdmin";
import { ToastContainer, toast } from "react-toastify";
import ImageCard from "./ImageCard";
import ImageCard2 from "./ImageCard2";
import ImageCard3 from "./ImageCard3";

const EditHomePage = () => {
	//Adding Variables

	const [allHomes, setAllHomes] = useState([]);
	const [addThumbnail, setAddThumbnail] = useState([]);
	const [addThumbnail2, setAddThumbnail2] = useState([]);
	const [addThumbnail3, setAddThumbnail3] = useState([]);
	const [header1, setHeader1] = useState("");
	const [header2, setHeader2] = useState("");
	const [header3, setHeader3] = useState("");

	// eslint-disable-next-line
	const [loading, setLoading] = useState("");
	// eslint-disable-next-line
	const [error, setError] = useState(false);
	// eslint-disable-next-line
	const [success, setSuccess] = useState(false);
	const { user, token } = isAuthenticated();

	const gettingAllHomes = () => {
		getHomes(token).then((data) => {
			if (data.error) {
				setError(data.error);
			} else {
				var lastAdded = data[data.length - 1];
				setError("");
				setAllHomes(lastAdded);
				if (
					lastAdded &&
					lastAdded.thumbnail &&
					lastAdded.thumbnail.length > 0
				) {
					setAddThumbnail(
						lastAdded && lastAdded.thumbnail
							? { images: lastAdded.thumbnail }
							: []
					);
				}

				if (
					lastAdded &&
					lastAdded.thumbnail2 &&
					lastAdded.thumbnail2.length > 0
				) {
					setAddThumbnail2(
						lastAdded && lastAdded.thumbnail2
							? { images: lastAdded.thumbnail2 }
							: []
					);
				}

				if (
					lastAdded &&
					lastAdded.thumbnail3 &&
					lastAdded.thumbnail3.length > 0
				) {
					setAddThumbnail3(
						lastAdded && lastAdded.thumbnail3
							? { images: lastAdded.thumbnail3 }
							: []
					);
				}

				if (lastAdded && lastAdded.header1) {
					setHeader1(lastAdded && lastAdded.header1 ? lastAdded.header1 : "");
				}

				if (lastAdded && lastAdded.header2) {
					setHeader2(lastAdded && lastAdded.header2 ? lastAdded.header2 : "");
				}

				if (lastAdded && lastAdded.header3) {
					setHeader3(lastAdded && lastAdded.header3 ? lastAdded.header3 : "");
				}
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
						const maxWidth = 1920;
						const maxHeight = 602;

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
	// eslint-disable-next-line

	const FileUploadThumbnail = () => {
		return (
			<>
				<ImageCard
					addThumbnail={addThumbnail}
					handleImageRemove={handleImageRemove}
					setAddThumbnail={setAddThumbnail}
					fileUploadAndResizeThumbNail={fileUploadAndResizeThumbNail}
				/>
			</>
		);
	};

	// eslint-disable-next-line
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

	const fileUploadAndResizeThumbNail2 = (e) => {
		let files = e.target.files;
		let updatedThumbnails = [...(addThumbnail2.images || [])]; // Initialize with an empty array if addThumbnail.images is undefined

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
						const maxWidth = 1920;
						const maxHeight = 602;

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
								setAddThumbnail2({ images: updatedThumbnails }); // Update the state with the new array
							})
							.catch((err) => {
								console.log("CLOUDINARY UPLOAD ERR", err);
							});
					};
				};
			}
		}
	};

	const FileUploadThumbnail2 = () => {
		return (
			<>
				<ImageCard2
					addThumbnail={addThumbnail2}
					handleImageRemove={handleImageRemove2}
					setAddThumbnail={setAddThumbnail2}
					fileUploadAndResizeThumbNail={fileUploadAndResizeThumbNail2}
				/>
			</>
		);
	};

	// eslint-disable-next-line
	const handleImageRemove2 = (public_id) => {
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
				const { images } = addThumbnail2;
				// let filteredImages = images.filter((item) => {
				// 	return item.public_id !== public_id;
				// });
				setAddThumbnail2([]);
			})
			.catch((err) => {
				console.log(err);
				setLoading(false);
				setTimeout(function () {
					window.location.reload(false);
				}, 1000);
			});
	};

	const fileUploadAndResizeThumbNail3 = (e) => {
		let files = e.target.files;
		let updatedThumbnails = [...(addThumbnail3.images || [])]; // Initialize with an empty array if addThumbnail.images is undefined

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
						const maxWidth = 1920;
						const maxHeight = 602;

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
								setAddThumbnail3({ images: updatedThumbnails }); // Update the state with the new array
							})
							.catch((err) => {
								console.log("CLOUDINARY UPLOAD ERR", err);
							});
					};
				};
			}
		}
	};

	const FileUploadThumbnail3 = () => {
		return (
			<>
				<ImageCard3
					addThumbnail={addThumbnail3}
					handleImageRemove={handleImageRemove3}
					setAddThumbnail={setAddThumbnail3}
					fileUploadAndResizeThumbNail={fileUploadAndResizeThumbNail3}
				/>
			</>
		);
	};

	// eslint-disable-next-line
	const handleImageRemove3 = (public_id) => {
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
				const { images } = addThumbnail3;
				// let filteredImages = images.filter((item) => {
				// 	return item.public_id !== public_id;
				// });
				setAddThumbnail3([]);
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
		gettingAllHomes();
		// eslint-disable-next-line
	}, []);

	const clickSubmit = (e) => {
		e.preventDefault();
		if (addThumbnail.length === 0) {
			return toast.error("Please add a background photo for the Home Page.");
		}

		if (addThumbnail2.length === 0) {
			return toast.error("Please add a background photo for the Home Page.");
		}

		setError("");
		setSuccess(false);
		// make request to api to create Category
		createHomePage(user._id, token, {
			thumbnail:
				addThumbnail && addThumbnail.images !== undefined
					? addThumbnail && addThumbnail.images
					: allHomes && allHomes.thumbnail,

			thumbnail2:
				addThumbnail2 && addThumbnail2.images !== undefined
					? addThumbnail2 && addThumbnail2.images
					: allHomes && allHomes.thumbnail2,

			thumbnail3:
				addThumbnail3 && addThumbnail3.images !== undefined
					? addThumbnail3 && addThumbnail3.images
					: allHomes && allHomes.thumbnail2,

			header1,
			header2,
			header3,
		}).then((data) => {
			if (data.error) {
				setError(data.error);
				setTimeout(function () {
					window.location.reload(false);
				}, 1000);
			} else {
				toast.success("Home Page was successfully Added.");
				setError("");
				setTimeout(function () {
					setAddThumbnail([]);
					setAddThumbnail2([]);
					setAddThumbnail3([]);
				}, 1500);
				setTimeout(function () {
					window.location.reload(false);
				}, 2500);
			}
		});
	};

	return (
		<div>
			<EditHomePageWrapper>
				<div
					className='col-md-9 mx-auto py-3'
					// style={{ border: "solid red 1px" }}
				>
					<h3 className='mt-1 mb-3 text-center'>Change "Home" Page</h3>
					<ToastContainer />
					<div className='row'>
						<div className='col-md-6'>
							{FileUploadThumbnail()}
							<div className='w-75 mx-auto'>
								<label>Header 1</label>
								<input
									type='text'
									max={30}
									onChange={(e) => setHeader1(e.target.value)}
									value={header1}
									className='form-control'
								/>
							</div>
						</div>
						<div className='col-md-6'>
							{FileUploadThumbnail2()}
							<div className='w-75 mx-auto'>
								<label>Header 2</label>
								<input
									type='text'
									max={30}
									onChange={(e) => setHeader2(e.target.value)}
									value={header2}
									className='form-control'
								/>
							</div>
						</div>
						<div className='col-md-6 mx-auto mt-3'>
							{FileUploadThumbnail3()}
							<div className='w-75 mx-auto'>
								<label>Header 3</label>
								<input
									type='text'
									max={30}
									onChange={(e) => setHeader3(e.target.value)}
									value={header3}
									className='form-control'
								/>
							</div>
						</div>
					</div>
				</div>

				<div className='mx-auto text-center'>
					<button className='btn btn-primary' onClick={clickSubmit}>
						Submit Changes
					</button>
				</div>
			</EditHomePageWrapper>
		</div>
	);
};

export default EditHomePage;

const EditHomePageWrapper = styled.div`
	margin-bottom: 100px;
`;
