import React, { useEffect, useState } from "react";
import styled from "styled-components";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import Quill CSS for styling
import { JanatWebsitePrivacy, getJanatWebsiteRecord } from "../apiAdmin";
import { toast } from "react-toastify";
import { isAuthenticated } from "../../auth";

const toolbarOptions = [
	[{ header: [1, 2, 3, 4, 5, 6, false] }],
	["bold", "italic", "underline", "strike", { color: [] }],
	[{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
	["link", "image", "video"],
	["clean"],
];

const ZTermsAndConditions = () => {
	const [termsAndConditionEnglish, setTermsAndConditionEnglish] = useState("");
	const [documentId, setDocumentId] = useState(undefined);

	const { user, token } = isAuthenticated();

	const gettingJanatWebsiteRecord = () => {
		getJanatWebsiteRecord().then((data) => {
			if (data && data.error) {
				console.log(data.error, "data.error");
			} else {
				if (data && data[0]) {
					setTermsAndConditionEnglish(data[0].termsAndConditionEnglish || "");

					setDocumentId(data[0]._id);
				}
			}
		});
	};

	useEffect(() => {
		gettingJanatWebsiteRecord();
		// eslint-disable-next-line
	}, []);

	const submitDocument = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });

		const myDocument = {
			termsAndConditionEnglish: termsAndConditionEnglish,
		};

		JanatWebsitePrivacy(documentId, myDocument, user._id, token).then(
			(data) => {
				if (data && data.error) {
					console.log(data.error, "Error creating a document");
				} else {
					setTimeout(() => {
						window.location.reload(false);
					}, 1500);
					toast.success("Janat Website Was Successfully Updated!");
				}
			}
		);
	};

	return (
		<ZTermsAndConditionsWrapper>
			<div className='form-group'>
				<label className='text-muted'>Terms and Conditions For Clients</label>
				<ReactQuill
					value={termsAndConditionEnglish}
					onChange={setTermsAndConditionEnglish}
					modules={{
						toolbar: { container: toolbarOptions },
						clipboard: { matchVisual: false },
					}}
					style={{ height: "400px" }}
				/>
			</div>

			<div className='' style={{ marginTop: "80px" }}>
				<button className='btn btn-primary' onClick={submitDocument}>
					Submit...
				</button>
			</div>
		</ZTermsAndConditionsWrapper>
	);
};

export default ZTermsAndConditions;

const ZTermsAndConditionsWrapper = styled.div`
	min-height: 700px;

	.form-group {
		margin-bottom: 20px;
	}

	.ql-toolbar {
		background-color: #f3f3f3;
		border-radius: 5px;
		border: 1px solid #ccc;
	}

	.ql-container {
		border: 1px solid #ccc;
		border-radius: 5px;
		background-color: #fff;
	}

	.ql-editor {
		min-height: 150px;
		max-height: 300px;
		overflow-y: auto;
		font-size: 14px;
	}

	.ql-editor.ql-blank::before {
		color: #999;
	}

	.arabic-editor .ql-editor {
		direction: rtl;
		text-align: right;
	}
`;
