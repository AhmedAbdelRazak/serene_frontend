// sections/HomeSection.js
import React from "react";
import axios from "axios";
import Resizer from "react-image-file-resizer";
import { isAuthenticated } from "../../auth";
import ImageCard from "./ImageCard";
import ImageCardHomeMainBanner from "./ImageCardHomeMainBanner";
import { cloudinaryUpload1 } from "../apiAdmin";

const HomeSection = ({ websiteData, setWebsiteData }) => {
	const { user, token } = isAuthenticated();

	const fileUploadLogo = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		// Use Resizer
		Resizer.imageFileResizer(
			file,
			300,
			100,
			"JPEG",
			100,
			0,
			(uri) => {
				cloudinaryUpload1(user._id, token, { image: uri })
					.then((data) => {
						// data => { url, public_id, etc.}
						setWebsiteData({
							...websiteData,
							sereneJannatLogo: { ...data },
						});
					})
					.catch((err) => {
						console.error("Logo upload error:", err);
					});
			},
			"base64"
		);
	};

	const handleLogoRemove = (public_id) => {
		// call remove image endpoint
		axios
			.post(
				`${process.env.REACT_APP_API_URL}/admin/removeimage`,
				{ public_id },
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			)
			.then((res) => {
				// remove from websiteData
				setWebsiteData({
					...websiteData,
					sereneJannatLogo: { public_id: "", url: "" },
				});
			})
			.catch((err) => {
				console.error("Error removing logo:", err);
			});
	};

	/* ----------------------------
	 * homeMainBanners (array)
	 * ---------------------------- */
	const fileUploadHomeBanners = (e) => {
		let files = e.target.files;
		if (!files) return;

		let allBanners = [...(websiteData.homeMainBanners || [])];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			Resizer.imageFileResizer(
				file,
				1920,
				997,
				"JPEG",
				100,
				0,
				(uri) => {
					cloudinaryUpload1(user._id, token, { image: uri })
						.then((data) => {
							// push in array
							allBanners.push({
								...data,
								title: "",
								titleIndian: "",
								subTitle: "",
								subtitleIndian: "",
								buttonTitle: "",
								buttonTitleIndian: "",
								pageRedirectURL: "",
								btnBackgroundColor: "",
							});
							setWebsiteData({
								...websiteData,
								homeMainBanners: allBanners,
							});
						})
						.catch((err) => {
							console.error("Banner upload error:", err);
						});
				},
				"base64"
			);
		}
	};

	const handleBannerRemove = (public_id) => {
		axios
			.post(
				`${process.env.REACT_APP_API_URL}/admin/removeimage`,
				{ public_id },
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			)
			.then(() => {
				let filtered = (websiteData.homeMainBanners || []).filter(
					(b) => b.public_id !== public_id
				);
				setWebsiteData({ ...websiteData, homeMainBanners: filtered });
			})
			.catch((err) => {
				console.error("Remove banner error:", err);
			});
	};

	const handleBannerFieldChange = (index, field, value) => {
		let newArr = [...(websiteData.homeMainBanners || [])];
		newArr[index][field] = value;
		setWebsiteData({ ...websiteData, homeMainBanners: newArr });
	};

	return (
		<div>
			<h3>Serene Jannat Logo</h3>
			<ImageCard
				singleImage={websiteData.sereneJannatLogo}
				setSingleImage={(obj) =>
					setWebsiteData({ ...websiteData, sereneJannatLogo: obj })
				}
				fileUploadAndResize={fileUploadLogo}
				handleImageRemove={handleLogoRemove}
				instructions='(Recommended: 300x100) .jpg/.png'
			/>

			<h3 style={{ marginTop: "30px" }}>Home Main Banners</h3>
			<ImageCardHomeMainBanner
				bannerData={{ images: websiteData.homeMainBanners || [] }}
				fileUploadAndResize={fileUploadHomeBanners}
				handleImageRemove={handleBannerRemove}
				handleFieldChange={handleBannerFieldChange}
				instructions='(1920x997 recommended) .jpg/.png'
			/>
		</div>
	);
};

export default HomeSection;
