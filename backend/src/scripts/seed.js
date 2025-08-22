const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@foodfiesta.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@foodfiesta.com',
        password: adminPassword,
        role: 'admin',
        phone: '9876543210',
        isEmailVerified: true
      }
    });
    console.log('✅ Admin user created');

    // Create sample customer
    const customerPassword = await bcrypt.hash('customer123', 12);
    const customer = await prisma.user.upsert({
      where: { email: 'customer@example.com' },
      update: {},
      create: {
        name: 'John Doe',
        email: 'customer@example.com',
        password: customerPassword,
        role: 'customer',
        phone: '9876543211',
        isEmailVerified: true
      }
    });
    console.log('✅ Sample customer created');

    // Create sample restaurant owner
    const restaurantOwnerPassword = await bcrypt.hash('restaurant123', 12);
    const restaurantOwner = await prisma.user.upsert({
      where: { email: 'restaurant@example.com' },
      update: {},
      create: {
        name: 'Restaurant Owner',
        email: 'restaurant@example.com',
        password: restaurantOwnerPassword,
        role: 'restaurant',
        phone: '9876543212',
        isEmailVerified: true
      }
    });
    console.log('✅ Sample restaurant owner created');

    // Create sample rider
    const riderPassword = await bcrypt.hash('rider123', 12);
    const rider = await prisma.user.upsert({
      where: { email: 'rider@example.com' },
      update: {},
      create: {
        name: 'Delivery Rider',
        email: 'rider@example.com',
        password: riderPassword,
        role: 'rider',
        phone: '9876543213',
        isEmailVerified: true
      }
    });
    console.log('✅ Sample rider created');

    // Create sample address for customer
    await prisma.address.upsert({
      where: { id: 'sample-address-1' },
      update: {},
      create: {
        id: 'sample-address-1',
        userId: customer.id,
        title: 'Home',
        house: '123, ABC Apartments',
        area: 'Banjara Hills',
        landmark: 'Near Metro Station',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500034',
        latitude: 17.4065,
        longitude: 78.4772,
        isDefault: true
      }
    });
    console.log('✅ Sample address created');

    // Create sample restaurant
    const restaurant = await prisma.restaurant.upsert({
      where: { userId: restaurantOwner.id },
      update: {},
      create: {
        userId: restaurantOwner.id,
        name: 'Biryani House',
        description: 'Authentic Hyderabadi Biryani and North Indian cuisine',
        cuisine: ['North Indian', 'Biryani', 'Mughlai'],
        image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        phone: '9876543212',
        email: 'restaurant@example.com',
        address: '456, Food Street, Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500033',
        latitude: 17.4239,
        longitude: 78.4738,
        rating: 4.5,
        totalReviews: 150,
        deliveryTime: '30-40 min',
        deliveryFee: 40,
        minimumOrder: 200,
        status: 'active',
        isOpen: true,
        openingTime: '10:00',
        closingTime: '23:00'
      }
    });
    console.log('✅ Sample restaurant created');

    // Create sample menu items
    const menuItems = [
      {
        name: 'Chicken Biryani',
        description: 'Aromatic basmati rice cooked with tender chicken pieces and exotic spices',
        price: 299,
        category: 'Biryani',
        image: 'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg',
        isVeg: false,
        isSpicy: true,
        preparationTime: 25
      },
      {
        name: 'Mutton Biryani',
        description: 'Rich and flavorful mutton pieces cooked with fragrant basmati rice',
        price: 399,
        category: 'Biryani',
        image: 'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg',
        isVeg: false,
        isSpicy: true,
        preparationTime: 35
      },
      {
        name: 'Veg Biryani',
        description: 'Mixed vegetables and paneer cooked with aromatic basmati rice',
        price: 249,
        category: 'Biryani',
        image: 'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg',
        isVeg: true,
        isSpicy: false,
        preparationTime: 20
      },
      {
        name: 'Butter Chicken',
        description: 'Tender chicken pieces in a rich tomato and cream based gravy',
        price: 329,
        category: 'Main Course',
        image: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg',
        isVeg: false,
        isSpicy: false,
        preparationTime: 20
      },
      {
        name: 'Paneer Butter Masala',
        description: 'Soft paneer cubes in a creamy tomato based curry',
        price: 269,
        category: 'Main Course',
        image: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg',
        isVeg: true,
        isSpicy: false,
        preparationTime: 15
      },
      {
        name: 'Garlic Naan',
        description: 'Soft tandoor bread topped with fresh garlic and coriander',
        price: 89,
        category: 'Breads',
        image: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg',
        isVeg: true,
        isSpicy: false,
        preparationTime: 10
      }
    ];

    for (const item of menuItems) {
      await prisma.menuItem.upsert({
        where: { 
          restaurantId_name: {
            restaurantId: restaurant.id,
            name: item.name
          }
        },
        update: {},
        create: {
          ...item,
          restaurantId: restaurant.id
        }
      });
    }
    console.log('✅ Sample menu items created');

    // Create rider profile
    await prisma.rider.upsert({
      where: { userId: rider.id },
      update: {},
      create: {
        userId: rider.id,
        vehicleType: 'bike',
        vehicleNumber: 'TS09AB1234',
        licenseNumber: 'DL123456789',
        aadharNumber: '123456789012',
        bankAccount: '1234567890',
        ifscCode: 'SBIN0001234',
        rating: 4.8,
        totalDeliveries: 250,
        isAvailable: true,
        isVerified: true
      }
    });
    console.log('✅ Sample rider profile created');

    // Create categories
    const categories = [
      {
        name: 'Biryani',
        description: 'Aromatic rice dishes with meat or vegetables',
        icon: '🍛',
        color: '#FF6B35',
        sortOrder: 1
      },
      {
        name: 'Pizza',
        description: 'Italian flatbread with various toppings',
        icon: '🍕',
        color: '#FF4757',
        sortOrder: 2
      },
      {
        name: 'South Indian',
        description: 'Traditional South Indian cuisine',
        icon: '🥥',
        color: '#2ED573',
        sortOrder: 3
      },
      {
        name: 'Chinese',
        description: 'Indo-Chinese fusion dishes',
        icon: '🥢',
        color: '#FFA502',
        sortOrder: 4
      },
      {
        name: 'Desserts',
        description: 'Sweet treats and desserts',
        icon: '🍰',
        color: '#FF6B9D',
        sortOrder: 5
      }
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category
      });
    }
    console.log('✅ Sample categories created');

    // Create sample coupon
    await prisma.coupon.upsert({
      where: { code: 'WELCOME50' },
      update: {},
      create: {
        code: 'WELCOME50',
        title: 'Welcome Offer',
        description: 'Get 50% off on your first order',
        discountType: 'percentage',
        discountValue: 50,
        minimumOrder: 300,
        maximumDiscount: 150,
        usageLimit: 1000,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        applicableFor: ['all'],
        restaurantIds: []
      }
    });
    console.log('✅ Sample coupon created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample Credentials:');
    console.log('Admin: admin@foodfiesta.com / admin123');
    console.log('Customer: customer@example.com / customer123');
    console.log('Restaurant: restaurant@example.com / restaurant123');
    console.log('Rider: rider@example.com / rider123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });