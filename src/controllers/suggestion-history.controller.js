const { ImportSuggestionHistory, User, Product } = require('~/models');


// Get all import suggestion history
const getImportSuggestion =  async (req, res) => {
  try {
    const importSuggestions = await ImportSuggestionHistory.findAll({
      include: [
        { model: User, as: 'user' },
        { model: Product, as: 'product' }
      ]
    });
    res.json({data:importSuggestions});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu đề xuất nhập hàng' });
  }
}
const getQuantityImportSuggestion =  async (req, res) => {
  try {
    const importSuggestions = await ImportSuggestionHistory.findAll({
     where:{
      status: 'pending'
     }
    });
    res.json({data:importSuggestions.length});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu đề xuất nhập hàng' });
  }
}




module.exports={
    getImportSuggestion,
    getQuantityImportSuggestion
}
