import { get, set } from 'idb-keyval';
import { FC, useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { useBoolean, useEventListener } from 'usehooks-ts';

import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { Box, Button, Container, IconButton, TextField } from '@mui/material';

import { resizeImage } from './resizer';

type Lambda<A, B> = (a: A) => B;

const Login: FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mt: "8rem" }}>
      <Box
        component="form"
        sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <TextField label="Login" variant="outlined" />
        <TextField label="Password" variant="outlined" />
        <Button
          variant="outlined"
          onClick={() => {
            navigate("/pictures");
          }}
        >
          login
        </Button>
      </Box>
    </Box>
  );
};

const PicturePreload: FC<{ pictures: File[] }> = ({ pictures }) => {
  return (
    <Box sx={{ border: "1px solid #4dd" }}>
      {pictures.map((picture) => {
        return (
          <img
            key={`${picture.name} ${picture.size}`}
            width="200"
            height="200"
            alt=""
            src={URL.createObjectURL(picture)}
          />
        );
      })}
    </Box>
  );
};

const PicturesUpload: FC = () => {
  const [picturesToSync, setPicturesToSync] = useState<File[]>([]);
  const { value: isSyncing, setValue: setIsSyncing } = useBoolean(false);
  const { value: isOnline, setValue: setIsOnline } = useBoolean(
    navigator.onLine
  );

  useEffect(() => {
    get("files").then((files) => {
      if (files !== undefined && files.length > 0) {
        setPicturesToSync(files);
      }
    });
  }, []);

  useEventListener("offline", () => {
    setIsOnline(false);
  });

  useEventListener("online", () => {
    setIsOnline(true);
  });

  useEventListener("online", () => {
    if (picturesToSync) {
      setIsSyncing(true);
      new Promise((ok) => {
        setTimeout(() => {
          console.log("UPLOADING");
          picturesToSync.forEach((picture) => {
            console.log(picture.name);
          });
          setPicturesToSync([]);
          set("files", []);
          ok(null);
        }, 500);
      }).then(() => {
        setIsSyncing(false);
      });
    }
  });

  return (
    <Box>
      {isOnline ? "You are online" : "You are offline"}
      <IconButton color="primary" component="label">
        <input
          hidden
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            const picturesList = e.target.files;
            const picture = picturesList?.item(0);
            if (picture !== null && picture !== undefined) {
              get("files").then((files) => {
                if (files !== undefined && files.length > 0) {
                  set("files", [...files, picture]);
                } else {
                  set("files", [picture]);
                }
              });

              resizeImage({ file: picture, maxSize: 200 }).then(
                (resizedPicture) => {
                  setPicturesToSync((pictures) => [
                    ...pictures,
                    resizedPicture,
                  ]);
                }
              );
            }
          }}
        />
        <PhotoCamera />
      </IconButton>
      <PicturePreload pictures={picturesToSync} />
      {isSyncing && <span>IS SYNCING...</span>}
    </Box>
  );
};

export const App: FC = () => {
  return (
    <Container maxWidth="sm">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="pictures" element={<PicturesUpload />} />
      </Routes>
    </Container>
  );
};
