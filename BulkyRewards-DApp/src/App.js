import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import './User.css';
import './Layout.css';

import Home from './components/Home';
import User from './components/User';
import Admin from './components/Admin';
import Layout from './components/Layout';

function App() {
    return (
        <div className="container">
            <div className="header">
                <span className='logo'>Bulky Rewards</span>
            </div>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="user" element={<User />} />
                        <Route path="admin" element={<Admin />} />
                    </Route>
                </Routes>
            </BrowserRouter>

        </div>
    );
}
  

export default App;