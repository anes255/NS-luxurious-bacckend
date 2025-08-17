// Test script to verify theme changes work
// Run this: node testThemeChange.js

const axios = require('axios');

// Make sure your backend is running on port 5000
const API_URL = 'http://localhost:5000/api';

// Admin credentials
const ADMIN_EMAIL = 'nessbusiness66@gmail.com';
const ADMIN_PASSWORD = 'lavieestbelle070478';

// Test themes
const themes = {
  blue: {
    primary: '#2196f3',
    secondary: '#64b5f6',
    accent: '#42a5f5',
    background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 50%, #e8f5e8 100%)',
    cardBackground: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(227,242,253,0.7))',
    textColor: '#2c3e50',
    borderColor: '#bbdefb',
    themeName: 'Blue Theme'
  },
  dark: {
    primary: '#bb86fc',
    secondary: '#3700b3',
    accent: '#03dac6',
    background: 'linear-gradient(135deg, #121212 0%, #1e1e1e 50%, #2d2d2d 100%)',
    cardBackground: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(187,134,252,0.1))',
    textColor: '#ffffff',
    borderColor: '#333333',
    themeName: 'Dark Theme'
  }
};

async function testThemeChange() {
  try {
    console.log('🎨 Testing Theme System\n');
    console.log('================================\n');

    // Step 1: Get current theme
    console.log('1️⃣ Getting current theme...');
    const currentThemeResponse = await axios.get(`${API_URL}/theme`);
    console.log('✅ Current theme:', currentThemeResponse.data.themeName);
    console.log('   Primary color:', currentThemeResponse.data.primary);
    console.log('\n');

    // Step 2: Change to Blue theme
    console.log('2️⃣ Changing to Blue theme...');
    const blueThemeResponse = await axios.post(
      `${API_URL}/theme/preset/blue`,
      {},
      {
        headers: {
          'email': ADMIN_EMAIL,
          'password': ADMIN_PASSWORD
        }
      }
    );
    console.log('✅ Response:', blueThemeResponse.data.message);
    console.log('\n');

    // Step 3: Verify theme changed
    console.log('3️⃣ Verifying theme change...');
    const newThemeResponse = await axios.get(`${API_URL}/theme`);
    console.log('✅ New theme:', newThemeResponse.data.themeName);
    console.log('   Primary color:', newThemeResponse.data.primary);
    
    if (newThemeResponse.data.primary === themes.blue.primary) {
      console.log('✅ Theme successfully changed to Blue!');
    } else {
      console.log('❌ Theme did not change properly');
    }
    console.log('\n');

    // Step 4: Test custom theme
    console.log('4️⃣ Testing custom theme...');
    const customTheme = {
      primary: '#ff5722',
      secondary: '#ff7043',
      accent: '#ff6e40',
      background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
      cardBackground: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,205,210,0.7))',
      textColor: '#3e2723',
      borderColor: '#ffccbc',
      themeName: 'Custom Orange Theme'
    };

    const customThemeResponse = await axios.post(
      `${API_URL}/theme`,
      customTheme,
      {
        headers: {
          'email': ADMIN_EMAIL,
          'password': ADMIN_PASSWORD
        }
      }
    );
    console.log('✅ Custom theme applied:', customThemeResponse.data.message);
    console.log('\n');

    // Step 5: Final verification
    console.log('5️⃣ Final verification...');
    const finalThemeResponse = await axios.get(`${API_URL}/theme`);
    console.log('✅ Current theme is now:', finalThemeResponse.data.themeName);
    console.log('   Primary color:', finalThemeResponse.data.primary);
    console.log('\n');

    console.log('================================');
    console.log('🎉 Theme system test complete!');
    console.log('\n📝 Instructions:');
    console.log('1. Open your browser to http://localhost:3000');
    console.log('2. The site should now show the', finalThemeResponse.data.themeName);
    console.log('3. Open another browser or incognito window');
    console.log('4. The theme should be the same in both windows');
    console.log('5. Login as admin and change theme in Theme Control');
    console.log('6. All users should see the new theme within 10 seconds');

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    console.error('\n🔧 Make sure:');
    console.error('1. Your backend is running (npm run dev in backend folder)');
    console.error('2. MongoDB is connected');
    console.error('3. Theme model is created in database');
  }
}

// Run the test
testThemeChange();