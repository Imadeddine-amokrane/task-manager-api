const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: (value) => {
        if (!validator.isEmail(value)) {
          throw Error('Please Enter a valid Email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: 7,
      validate(value) {
        if (value.toLowerCase().includes('password')) {
          throw new Error('Password cannot contain "password"');
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error('Age must be a positive number');
        }
      },
    },

    tokens: [{ token: { type: String, required: true } }],
    avatar: { type: Buffer },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual('myTasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner',
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userJSObject = user.toObject();

  delete userJSObject.password;
  delete userJSObject.tokens;
  delete userJSObject.avatar;

  return userJSObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

  user.tokens = [...user.tokens, { token }];

  await user.save();

  return token;
};

userSchema.statics.findByCredenntials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('Unable to login!');
  }

  const isMAtch = await bcrypt.compare(password, user.password);

  if (!isMAtch) {
    throw new Error('Unable to login!');
  }
  return user;
};

userSchema.pre('save', async function (next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

// userSchema.post('deleteOne', async function (next) {
//   const user = this;

//   await Task.deleteMany({ owner: user._id });

//   next();
// });

const User = mongoose.model('User', userSchema);

module.exports = User;

// const me = new User({
//   name: 'Imadeddine',
//   email: 'IMAD@gmail.com',
//   password: '123456789',
//   age: 28,
// });

// me.save()
//   .then((user) => {
//     console.log(user);
//   })
//   .catch((err) => {
//     console.log(err);
//   });

// console.log('Waiting');
