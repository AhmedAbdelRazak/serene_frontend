import { useEffect, useState } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { getOnlineStoreData } from "../../Global";

const LastAddedLogoImage = () => {
	const [logoUrl, setLogoUrl] = useState(
		"https://res.cloudinary.com/infiniteapps/image/upload/v1640547562/Infinite-Apps/MyLogo_p0bqjs.jpg"
	);

	useEffect(() => {
		const fetchData = async () => {
			const url = await getOnlineStoreData();
			setLogoUrl(url);
		};

		fetchData();
	}, []);

	return (
		<LastAddedLogoImageWrapper onClick={() => (window.location.href = "/")}>
			<Link to='/'>
				<img id='logoImage' src={logoUrl} alt='infinite-apps.com' />
			</Link>
		</LastAddedLogoImageWrapper>
	);
};

export default LastAddedLogoImage;

const LastAddedLogoImageWrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 10px;
	margin-left: 20px;
	background-color: white;
	img {
		width: 80%;
		max-width: 150px;
		object-fit: cover;
	}
`;
