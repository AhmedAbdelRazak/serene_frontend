// sections/HomeSection.js
import React from "react";
import axios from "axios";
import Resizer from "react-image-file-resizer";
import { isAuthenticated } from "../../auth";
import ImageCard from "./ImageCard";
import ImageCardHomeMainBanner from "./ImageCardHomeMainBanner";
import { cloudinaryUpload1 } from "../apiAdmin";
import { Switch, Divider } from "antd"; // ← NEW

const HomeSection = ({ websiteData, setWebsiteData }) => {
	/* -------------------------------------------------- */
	/* Auth & helpers                                      */
	/* -------------------------------------------------- */
	const { user, token } = isAuthenticated();

	/* ----------  Logo (single)  ------------------------ */
	const fileUploadLogo = (e) => {
		const file = e.target.files[0];
		if (!file) return;

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
						setWebsiteData({
							...websiteData,
							sereneJannatLogo: { ...data },
						});
					})
					.catch((err) => console.error("Logo upload error:", err));
			},
			"base64"
		);
	};

	const handleLogoRemove = (public_id) => {
		axios
			.post(
				`${process.env.REACT_APP_API_URL}/admin/removeimage`,
				{ public_id },
				{ headers: { Authorization: `Bearer ${token}` } }
			)
			.then(() => {
				setWebsiteData({
					...websiteData,
					sereneJannatLogo: { public_id: "", url: "" },
				});
			})
			.catch((err) => console.error("Error removing logo:", err));
	};

	/* ----------  Home‑page MAIN banners (array)  ------- */
	const fileUploadHomeBanners = (e) => {
		const files = e.target.files;
		if (!files) return;

		const current = [...(websiteData.homeMainBanners || [])];

		Array.from(files).forEach((file) => {
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
							current.push({
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
							setWebsiteData({ ...websiteData, homeMainBanners: current });
						})
						.catch((err) => console.error("Banner upload error:", err));
				},
				"base64"
			);
		});
	};

	const handleBannerRemove = (public_id) => {
		axios
			.post(
				`${process.env.REACT_APP_API_URL}/admin/removeimage`,
				{ public_id },
				{ headers: { Authorization: `Bearer ${token}` } }
			)
			.then(() => {
				const filtered = (websiteData.homeMainBanners || []).filter(
					(b) => b.public_id !== public_id
				);
				setWebsiteData({ ...websiteData, homeMainBanners: filtered });
			})
			.catch((err) => console.error("Remove banner error:", err));
	};

	const handleBannerFieldChange = (index, field, value) => {
		const updated = [...(websiteData.homeMainBanners || [])];
		updated[index][field] = value;
		setWebsiteData({ ...websiteData, homeMainBanners: updated });
	};

	/* -------------------------------------------------- */
	/* NEW: Boolean Toggles                               */
	/* -------------------------------------------------- */
	const handleToggle = (field) => (checked) =>
		setWebsiteData({ ...websiteData, [field]: checked });

	/* -------------------------------------------------- */
	/* Render                                             */
	/* -------------------------------------------------- */
	return (
		<div>
			<h3>Serene Jannat Logo</h3>
			<ImageCard
				singleImage={websiteData.sereneJannatLogo}
				setSingleImage={(obj) =>
					setWebsiteData({ ...websiteData, sereneJannatLogo: obj })
				}
				fileUploadAndResize={fileUploadLogo}
				handleImageRemove={handleLogoRemove}
				instructions='(Recommended: 300 × 100) .jpg/.png'
			/>

			{/* ----------------  NEW TOGGLES  ---------------- */}
			<Divider orientation='left' style={{ marginTop: 40 }}>
				General Settings
			</Divider>

			<div style={{ display: "flex", gap: "60px", flexWrap: "wrap" }}>
				<div>
					<span style={{ marginRight: 12, fontWeight: 500 }}>
						Deactivate Chat Response
					</span>
					<Switch
						checked={!!websiteData.deactivateChatResponse}
						onChange={handleToggle("deactivateChatResponse")}
					/>
				</div>

				<div>
					<span style={{ marginRight: 12, fontWeight: 500 }}>
						AI Agent to Respond
					</span>
					<Switch
						checked={!!websiteData.aiAgentToRespond}
						onChange={handleToggle("aiAgentToRespond")}
					/>
				</div>

				<div>
					<span style={{ marginRight: 12, fontWeight: 500 }}>
						Deactivate Order Creation
					</span>
					<Switch
						checked={!!websiteData.deactivateOrderCreation}
						onChange={handleToggle("deactivateOrderCreation")}
					/>
				</div>
			</div>

			{/* --------------  BANNERS  ---------------------- */}
			<h3 style={{ marginTop: 40 }}>Home Main Banners</h3>
			<ImageCardHomeMainBanner
				bannerData={{ images: websiteData.homeMainBanners || [] }}
				fileUploadAndResize={fileUploadHomeBanners}
				handleImageRemove={handleBannerRemove}
				handleFieldChange={handleBannerFieldChange}
				instructions='(1920 × 997 recommended) .jpg/.png'
			/>
		</div>
	);
};

export default HomeSection;
