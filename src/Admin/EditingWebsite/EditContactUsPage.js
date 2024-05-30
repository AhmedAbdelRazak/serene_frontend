/** @format */

import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { isAuthenticated } from "../../auth/index";
import { createContact, getContacts } from "../apiAdmin";
import { ToastContainer, toast } from "react-toastify";
import ReactQuill from "react-quill";

const toolbarOptions = [
	[{ header: [1, 2, 3, 4, 5, 6, false] }],
	["bold", "italic", "underline", "strike", { color: [] }],
	[{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
	["link", "image", "video"],
	["clean"],
];

const EditContactUsPage = () => {
	//Adding Variables
	const [business_hours, setBusinessHours] = useState("");
	const [business_hours_Arabic, setBusinessHours_Arabic] = useState("");
	const [address, setAddress] = useState("");
	const [address_Arabic, setAddress_Arabic] = useState("");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");

	const [header_1, setHeader1] = useState("");
	const [header_1_Arabic, setHeader1_Arabic] = useState("");
	const [description_1, setDescription1] = useState("");
	const [description_1_Arabic, setDescription1_Arabic] = useState("");
	// eslint-disable-next-line
	const [allContacts, setAllContacts] = useState([]);

	// eslint-disable-next-line
	const [loading, setLoading] = useState("");
	// eslint-disable-next-line
	const [error, setError] = useState(false);
	// eslint-disable-next-line
	const [success, setSuccess] = useState(false);
	const { user, token } = isAuthenticated();

	const handleChange1 = (e) => {
		setError("");
		setBusinessHours(e.target.value);
	};

	const handleChange3 = (e) => {
		setError("");
		setAddress(e.target.value);
	};

	const handleChange5 = (e) => {
		setError("");
		setPhone(e.target.value);
	};

	const handleChange6 = (e) => {
		setError("");
		setEmail(e.target.value);
	};

	const handleChange7 = (e) => {
		setError("");
		setHeader1(e.target.value);
	};

	const gettingAllContacts = () => {
		getContacts(token).then((data) => {
			if (data.error) {
				setError(data.error);
			} else {
				setError("");
				setAllContacts(data[data.length - 1]);
				setHeader1(data[data.length - 1] && data[data.length - 1].header_1);
				setBusinessHours(
					data[data.length - 1] && data[data.length - 1].business_hours
				);
				setBusinessHours_Arabic(
					data[data.length - 1] && data[data.length - 1].business_hours_Arabic
				);
				setAddress(data[data.length - 1] && data[data.length - 1].address);
				setAddress_Arabic(
					data[data.length - 1] && data[data.length - 1].address_Arabic
				);
				setPhone(data[data.length - 1] && data[data.length - 1].phone);
				setEmail(data[data.length - 1] && data[data.length - 1].email);

				setHeader1_Arabic(
					data[data.length - 1] && data[data.length - 1].header_1_Arabic
				);
				setDescription1(
					data[data.length - 1] && data[data.length - 1].description_1
				);
				setDescription1_Arabic(
					data[data.length - 1] && data[data.length - 1].description_1_Arabic
				);
			}
		});
	};

	useEffect(() => {
		gettingAllContacts();
		// eslint-disable-next-line
	}, []);

	const clickSubmit = (e) => {
		e.preventDefault();

		setError("");
		setSuccess(false);
		// make request to api to create Category
		createContact(user._id, token, {
			address,
			address_Arabic,
			email,
			phone,
			business_hours,
			business_hours_Arabic,
			header_1,
			header_1_Arabic,
			description_1,
			description_1_Arabic,
		}).then((data) => {
			if (data.error) {
				setError(data.error);
				setTimeout(function () {
					window.location.reload(false);
				}, 1000);
			} else {
				toast.success("Contact Us was successfully Added.");
				setError("");
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

	const newContactForm = () => (
		<form onSubmit={clickSubmit} dir='ltr'>
			<div className='row'>
				<div className='col-md-5 mx-auto'>
					<label className='text-muted'>Add Business Hours</label>
					<input
						type='text'
						className='form-control'
						onChange={handleChange1}
						value={business_hours}
						required
					/>
				</div>

				<div className='col-md-5 mx-auto mt-3'>
					<label className='text-muted'>Add Store Address</label>
					<input
						type='text'
						className='form-control'
						onChange={handleChange3}
						value={address}
						required
					/>
				</div>

				<div className='col-md-5 mx-auto mt-3'>
					<label className='text-muted'> Support Phone</label>
					<input
						type='text'
						className='form-control'
						onChange={handleChange5}
						value={phone}
						required
					/>
				</div>
				<div className='col-md-5 mx-auto mt-3'>
					<label className='text-muted'>Support Email</label>
					<input
						type='text'
						className='form-control'
						onChange={handleChange6}
						value={email}
						required
					/>
				</div>
			</div>
			<div className='form-group mt-4'>
				<label className='text-muted'>Add Header For Contact Us Page</label>
				<input
					type='text'
					className='form-control'
					onChange={handleChange7}
					value={header_1}
					required
				/>
			</div>

			<div className='col-md-10 mx-auto mb-5'>
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
			<div className='pt-3'>
				<button className='btn btn-outline-primary mb-3'>Submit Changes</button>
			</div>
		</form>
	);

	return (
		<div>
			<EditContactUsPageWrapper>
				<div
					className='col-md-9 mx-auto py-3'
					// style={{ border: "solid red 1px" }}
				>
					<h3 className='mt-1 mb-3 text-center'>Change "Contact Us" Page</h3>
					<ToastContainer />

					{newContactForm()}
				</div>
			</EditContactUsPageWrapper>
		</div>
	);
};

export default EditContactUsPage;

const EditContactUsPageWrapper = styled.div`
	margin-bottom: 20px;
`;
