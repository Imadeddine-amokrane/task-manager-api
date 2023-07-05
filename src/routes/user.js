const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');

const router = new express.Router();

router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    const token = await user.generateAuthToken();
    sendWelcomeEmail(user.email, user.name);
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }

  // user
  //   .save()
  //   .then(() => {
  //     res.status(201).send(user);
  //   })
  //   .catch((e) => {
  //     res.status(400).send(e);
  //   });
});

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredenntials(
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthToken();
    res.status(200).send({ user, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => req.token !== token.token
    );

    await req.user.save();
    res.status(200).send();
  } catch (err) {
    res.status(500).send();
  }
});

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = [];

    await req.user.save();
    res.status(200).send();
  } catch (err) {
    res.status(500).send();
  }
});

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user);

  // try {
  //   const users = await User.find({});
  //   if (!users) return res.status(500).send();
  //   res.status(200).send(users);
  // } catch (e) {
  //   res.status(500).send(e);
  // }
  // User.find({}, { age: 0 })
  //   .then((users) => {
  //     if (!users) res.status(500).send();
  //     res.send(users);
  //   })
  //   .catch((e) => {
  //     res.status(500).send();
  //   });
});

router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'age', 'email', 'password'];
  const isValidUpdate = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidUpdate) {
    return res.status(400).send({ error: 'invalid update' });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));

    await req.user.save();

    // const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    //   new: true,
    //   runValidators: true,
    // });

    res.status(200).send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete('/users/me', auth, async (req, res) => {
  try {
    await User.deleteOne(req.user);
    await Task.deleteMany({ owner: req.user._id });
    sendCancelationEmail(req.user.email, req.user.name);
    res.status(200).send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});

const upload = multer({
  // dest: './avatars', //This will store all uploaded files in a directory called avatars.
  limits: {
    fileSize: 1000000, // the max file size (in bytes)
  },
  // Validation
  fileFilter(req, file, cb) {
    if (!file || !file.originalname.match(/\.(jpg|jpeg|png)/)) {
      //originalname:name of the file on the user machine
      return cb(new Error('Please upload an image'));
    }
    cb(undefined, true);
  },
});

router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) throw new Error('No file');
      // Formatting images using Sharp
      const buffer = await sharp(req.file.buffer)
        .resize(320, 250)
        .png()
        .toBuffer();
      //Adding images to user profile
      //avatar: { type: Buffer },
      req.user.avatar = buffer;
      await req.user.save();
      res.sendStatus(200);
    } catch (err) {
      res.status(400).send({ error: err.message });
    }
  },
  (error, req, res, next) => {
    //Handling Errors
    res.status(400).send({ error: error.message });
  }
);

// Serving up images
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }

    // Set Headers for response
    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (err) {
    res.sendStatus(404);
  }
});

router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.sendStatus(200);
});

module.exports = router;
