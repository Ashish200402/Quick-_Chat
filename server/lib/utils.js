import jwt from 'jsonwebtoken';

//  Function to generate a JWT token fo a user
export const generateToken = (userid) => {
    const token = jwt.sign({ id: userid }, process.env.JWT_SECRET);
    return token;
};