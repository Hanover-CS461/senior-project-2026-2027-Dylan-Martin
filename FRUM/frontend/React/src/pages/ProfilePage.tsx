import { useNavigate } from "react-router";
function ProfilePage() {
    const navigate = useNavigate()

    const logout = async () => {
		const res = await fetch('/api/credential/logout', {
			method: 'DELETE',
		})
		if (res.ok) {
			const data = await res.json();
			console.log(data);
			handleLogoutSuccess();
		}
	}
	
	function handleLogoutSuccess() {
		navigate("/login");
	}

	const removeAccount = async () => {
        const res = await fetch('api/credential/removeUser', {
            method: 'DELETE'
        });
        if (res.ok) {
            console.log(res)
            logout()
        }
	}

    function goToChat() {
        navigate("/chat")
    }

    return (
        <div>
            <header>Profile Management</header>
            <button className="account__remove__account" onClick={ removeAccount }>Remove Account</button>
            <button className="account__to__chat" onClick={ goToChat }>Start Chatting</button>
        </div>
    )
}

export default ProfilePage