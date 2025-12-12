import React from 'react'
import type { CreateOrConnectUser } from '../types/user.types';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { userActions } from '../store/user-slice';


const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [userData, setUserData] = React.useState<CreateOrConnectUser>({
    email: "",
    password: "",
  });
  const [error, setError] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState<boolean>(false);

  const changeInputHandler = (e: React.ChangeEvent<HTMLInputElement>) => {

    setUserData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value
    }))
  }

  const loginUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/login`, userData);
      if (response.status === 200) {
        console.log(response);
        dispatch(userActions.changeCurrentUser(response?.data?.userInfo));
        localStorage.setItem("currentUser", JSON.stringify(response?.data?.userInfo))
        navigate("/");
      }
    } catch (error) {
      let msg = "";
      if (axios.isAxiosError(error)) {
        msg = error?.response?.data?.message;
      } else if (error instanceof Error) {
        msg = error?.message;
      } else {
        msg = "Une erreur inconnue est survenue.";
      }
      setError(msg);
    }
  }

  return (
    <section className="register">
      <div className="container register__container">
        <h2>Connexion</h2>
        <form onSubmit={e => loginUser(e)}>
          {error && <p className="form__error-message">{error}</p>}
          <input type="email" name="email" placeholder='Email' onChange={e => changeInputHandler(e)} />
          <div className="password__controller">
            <input
              type={showPassword ? "text" : "password"}
              name='password'
              placeholder='Mot de passe'
              onChange={e => changeInputHandler(e)} />
            <span onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</span>
          </div>

          <p>Vous n'avez pas de compte ? <Link to="/register">Inscription</Link></p>
          <button type='submit' className='btn primary'>Connexion</button>
        </form>
      </div>
    </section>
  )
}

export default Login