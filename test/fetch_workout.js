import axios from 'axios';

const muscle = 'biceps';
const api_url = `https://api.api-ninjas.com/v1/exercises?muscle=${muscle}`;
const response = await axios.get(api_url, {
  headers: {
    'X-Api-Key': '+9EuQ1XOsxBunAlNLWjK1g==7PGhFoKoQiyw2bBl'
  }
});

if (response.status === 200) {
  console.log(response.data);
} else {
  console.error('Error:', response.status, response.data);
}
