import React, { useState } from 'react';
import * as yup from 'yup';
import axios from 'axios';

const validationErrors = {
  fullNameTooShort: 'Full name must be at least 3 characters',
  fullNameTooLong: 'Full name must be at most 20 characters',
  sizeIncorrect: 'Size must be S or M or L'
};

const formSchema = yup.object().shape({
  fullName: yup.string()
    .trim()
    .min(3, validationErrors.fullNameTooShort)
    .max(20, validationErrors.fullNameTooLong)
    .required('Full name is required'),
  size: yup.string()
    .oneOf(['S', 'M', 'L'], validationErrors.sizeIncorrect)
    .required('Size is required'),
  toppings: yup.array().of(yup.string().oneOf(['1', '2', '3', '4', '5']))
});

const toppings = [
  { topping_id: '1', text: 'Pepperoni' },
  { topping_id: '2', text: 'Green Peppers' },
  { topping_id: '3', text: 'Pineapple' },
  { topping_id: '4', text: 'Mushrooms' },
  { topping_id: '5', text: 'Ham' }
];

export default function Form() {
  const [formState, setFormState] = useState({
    fullName: '',
    size: '',
    toppings: []
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [orderData, setOrderData] = useState(null);

  const validateChange = (name, value) => {
    yup
      .reach(formSchema, name)
      .validate(value)
      .then(() => setErrors({ ...errors, [name]: '' }))
      .catch(err => setErrors({ ...errors, [name]: err.errors[0] }));
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox'
      ? checked
        ? [...formState.toppings, value]
        : formState.toppings.filter(t => t !== value)
      : value;

    setFormState({
      ...formState,
      [name]: val
    });

    validateChange(name, val);
  };

  const handleSubmit = e => {
    e.preventDefault();

    formSchema
      .validate(formState, { abortEarly: false })
      .then(() => {
        axios.post('http://localhost:9009/api/order', formState)
          .then(() => {
            setSuccess(true);
            setOrderData(formState);
            setFormState({
              fullName: '',
              size: '',
              toppings: []
            })
          })
          .catch(() => {
            setSuccess(false)
          });
      })
      .catch(err => {
        const validationErrors = {};
        err.inner.forEach(error => {
          validationErrors[error.path] = error.message;
        });
        setErrors(validationErrors);
      });
  };

  const sizeMap = {
    'S': 'small',
    'M': 'medium',
    'L': 'large'
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Order Your Pizza</h2>
      {success === true && orderData && (
        <div className='success'>
          Thank you for your order, {orderData.fullName}! Your {sizeMap[orderData.size]} pizza {orderData.toppings.length > 0 ? `with ${orderData.toppings.length} topping${orderData.toppings.length !== 1 ? 's' : ''}` : 'with no toppings'} is on the way.
        </div>
      )}
      {success === false && <div className='failure'>Something went wrong</div>}

      <div className="input-group">
        <div>
          <label htmlFor="fullName">Full Name</label><br />
          <input
            placeholder="Type full name"
            id="fullName"
            type="text"
            name="fullName"
            value={formState.fullName}
            onChange={handleChange}
          />
        </div>
        {errors.fullName && <div className='error'>{errors.fullName}</div>}
      </div>

      <div className="input-group">
        <div>
          <label htmlFor="size">Size</label><br />
          <select id="size" name="size" value={formState.size} onChange={handleChange}>
            <option value="">----Choose Size----</option>
            <option value="S">Small</option>
            <option value="M">Medium</option>
            <option value="L">Large</option>
          </select>
        </div>
        {errors.size && <div className='error'>{errors.size}</div>}
      </div>

      <div className="input-group">
        {toppings.map(topping => (
          <label key={topping.topping_id}>
            <input
              type="checkbox"
              name="toppings"
              value={topping.topping_id}
              checked={formState.toppings.includes(topping.topping_id)}
              onChange={handleChange}
            />
            {topping.text}<br />
          </label>
        ))}
      </div>

      <input type="submit" disabled={!formSchema.isValidSync(formState)} />
    </form>
  );
}
